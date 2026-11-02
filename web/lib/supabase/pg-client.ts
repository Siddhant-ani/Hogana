import 'server-only';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

/**
 * HOGANA PostgreSQL Connection Pooler Manager
 * 
 * Supports:
 * - Shared Transaction-Mode Pooler (DATABASE_URL, Port 6543) for application queries.
 * - Shared Session-Mode Pooler (DIRECT_URL, Port 5432) for schema migrations.
 */

let appPool: Pool | null = null;
let migrationPool: Pool | null = null;

function sanitizeConnectionString(connStr: string): string {
  // Check if string contains placeholder
  if (connStr.includes('[YOUR-PASSWORD]')) {
    throw new Error('PostgreSQL connection string contains unpopulated [YOUR-PASSWORD] placeholder. Configure actual database password.');
  }
  return connStr.trim();
}

export function getAppDatabasePool(): Pool | null {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;

  try {
    const sanitized = sanitizeConnectionString(dbUrl);
    if (!appPool) {
      appPool = new Pool({
        connectionString: sanitized,
        max: 10, // Stay well within Supabase Free plan pooler limits
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        ssl: { rejectUnauthorized: false }
      });

      appPool.on('error', (err) => {
        console.error('Unexpected error on idle PostgreSQL pool client:', err.message);
      });
    }
    return appPool;
  } catch (err) {
    return null;
  }
}

export function getMigrationDatabasePool(): Pool | null {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) return null;

  try {
    const sanitized = sanitizeConnectionString(directUrl);
    if (!migrationPool) {
      migrationPool = new Pool({
        connectionString: sanitized,
        max: 2, // Session pooler handles fewer concurrent connections
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 10000,
        ssl: { rejectUnauthorized: false }
      });
    }
    return migrationPool;
  } catch (err) {
    return null;
  }
}

export async function query<R extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<R>> {
  const pool = getAppDatabasePool();
  if (!pool) {
    throw new Error('PostgreSQL DATABASE_URL is not configured or contains unpopulated placeholders.');
  }
  return pool.query<R>(text, params);
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getAppDatabasePool();
  if (!pool) {
    throw new Error('PostgreSQL DATABASE_URL is not configured.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
