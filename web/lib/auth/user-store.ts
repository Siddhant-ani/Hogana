import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  company?: string;
  role: 'administrator' | 'data_manager' | 'dispatcher' | 'analyst';
  organizationId: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function buildDefaultOperator(): StoredUser {
  const salt = '3508c99d32951e4c750b10fad454553e';
  const passwordHash = hashPassword('HoganaOps@2025!', salt);
  return {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'operator@hogana.transit',
    name: 'Lead Operations Dispatcher',
    company: 'HOGANA Transit Operations',
    role: 'dispatcher',
    organizationId: 'a0000000-0000-0000-0000-000000000001',
    salt,
    passwordHash,
    createdAt: new Date().toISOString()
  };
}

// In-memory process cache (resilient across serverless invocations within warm lambdas)
const inMemoryUsers: Map<string, StoredUser> = new Map();

// Seed operator in memory immediately
const defaultOp = buildDefaultOperator();
inMemoryUsers.set(defaultOp.email.toLowerCase(), defaultOp);

const defaultSiddhant: StoredUser = {
  id: '8afb313d-930d-4773-9f28-d007b85d9b2c',
  email: 'siddhantdash1212@gmail.com',
  name: 'Siddhant Dash',
  company: 'City Bus Operations',
  role: 'administrator',
  organizationId: 'a0000000-0000-0000-0000-000000000001',
  salt: 'ff62d88013ba5d52ed68277c891bdd10',
  passwordHash: '734a82d97a9f739aa30b8b2ab3d56aaf20ce36a81bc6d9c14aad2d94cf7059ce69962aa92a76034529394e09fc44031729c52f959165127873b47311936a108d',
  createdAt: '2026-11-03T09:47:30.707Z'
};
inMemoryUsers.set(defaultSiddhant.email.toLowerCase(), defaultSiddhant);

function getCandidateReadPaths(): string[] {
  return [
    path.resolve(os.tmpdir(), 'hogana_registered_users.json'),
    path.resolve(process.cwd(), 'data', 'research', 'registered_users.json'),
    path.resolve(process.cwd(), '..', 'data', 'research', 'registered_users.json'),
    path.resolve(process.cwd(), 'web', 'data', 'research', 'registered_users.json')
  ];
}

function getWritablePath(): string {
  // On Vercel serverless / AWS Lambda, /tmp is always writable
  return path.resolve(os.tmpdir(), 'hogana_registered_users.json');
}

export async function getRegisteredUsers(): Promise<StoredUser[]> {
  const readPaths = getCandidateReadPaths();

  for (const p of readPaths) {
    try {
      const raw = await fs.readFile(p, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const u of parsed) {
          if (u.email && !inMemoryUsers.has(u.email.toLowerCase())) {
            inMemoryUsers.set(u.email.toLowerCase(), u);
          }
        }
      }
    } catch {
      // Continue searching candidates
    }
  }

  return Array.from(inMemoryUsers.values());
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const normalized = email.toLowerCase().trim();
  // Check in-memory map first (instant, zero I/O)
  if (inMemoryUsers.has(normalized)) {
    return inMemoryUsers.get(normalized)!;
  }

  const users = await getRegisteredUsers();
  return users.find((u) => u.email.toLowerCase().trim() === normalized) || null;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  const users = await getRegisteredUsers();
  return users.find((u) => u.id === id) || null;
}

export async function registerUser(params: {
  email: string;
  password: string;
  name: string;
  company?: string;
  role?: 'administrator' | 'data_manager' | 'dispatcher' | 'analyst';
  organizationId?: string;
}): Promise<StoredUser> {
  const normalizedEmail = params.email.toLowerCase().trim();
  const existing = await findUserByEmail(normalizedEmail);

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(params.password, salt);
  const id = existing ? existing.id : crypto.randomUUID();

  const userRecord: StoredUser = {
    id,
    email: normalizedEmail,
    name: params.name.trim() || (existing ? existing.name : 'Operator'),
    company: params.company?.trim() || (existing ? existing.company : undefined),
    role: params.role || (existing ? existing.role : 'dispatcher'),
    organizationId: params.organizationId || (existing ? existing.organizationId : 'a0000000-0000-0000-0000-000000000001'),
    salt,
    passwordHash,
    createdAt: existing ? existing.createdAt : new Date().toISOString()
  };

  // Add to memory
  inMemoryUsers.set(normalizedEmail, userRecord);

  // Write to writable temp store (works on Vercel, Docker, Localhost)
  try {
    const allUsers = Array.from(inMemoryUsers.values());
    const writePath = getWritablePath();
    await fs.writeFile(writePath, JSON.stringify(allUsers, null, 2), 'utf8');
  } catch {
    // Retain in memory if write fails
  }

  return userRecord;
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<StoredUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;

  try {
    const computedHash = hashPassword(password, user.salt);
    const bufA = Buffer.from(computedHash, 'hex');
    const bufB = Buffer.from(user.passwordHash, 'hex');
    if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
      return user;
    }
  } catch {
    return null;
  }

  return null;
}
