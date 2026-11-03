import 'server-only';
import fs from 'fs/promises';
import path from 'path';
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

function getCandidatePaths(): string[] {
  return [
    path.resolve(process.cwd(), 'data', 'research', 'registered_users.json'),
    path.resolve(process.cwd(), '..', 'data', 'research', 'registered_users.json'),
    path.resolve(process.cwd(), '.next', 'registered_users.json')
  ];
}

async function resolveStoragePath(): Promise<string> {
  const candidates = getCandidatePaths();
  for (const cand of candidates) {
    try {
      await fs.mkdir(path.dirname(cand), { recursive: true });
      return cand;
    } catch {
      // try next
    }
  }
  return candidates[0];
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
    role: 'dispatcher',
    organizationId: 'a0000000-0000-0000-0000-000000000001',
    salt,
    passwordHash,
    createdAt: new Date().toISOString()
  };
}

export async function getRegisteredUsers(): Promise<StoredUser[]> {
  const targetPath = await resolveStoragePath();
  try {
    const raw = await fs.readFile(targetPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // initialize
  }

  // Seed default operator account
  const initial = [buildDefaultOperator()];
  try {
    await fs.writeFile(targetPath, JSON.stringify(initial, null, 2), 'utf8');
  } catch {
    // fallback memory
  }
  return initial;
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const users = await getRegisteredUsers();
  const normalized = email.toLowerCase().trim();
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
  const users = await getRegisteredUsers();

  const existing = users.find((u) => u.email.toLowerCase().trim() === normalizedEmail);
  if (existing) {
    throw new Error('An account with this email address already exists. Please sign in instead.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(params.password, salt);
  const id = crypto.randomUUID();

  const newUser: StoredUser = {
    id,
    email: normalizedEmail,
    name: params.name.trim(),
    company: params.company?.trim(),
    role: params.role || 'dispatcher',
    organizationId: params.organizationId || 'a0000000-0000-0000-0000-000000000001',
    salt,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);

  const targetPath = await resolveStoragePath();
  await fs.writeFile(targetPath, JSON.stringify(users, null, 2), 'utf8');

  return newUser;
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
