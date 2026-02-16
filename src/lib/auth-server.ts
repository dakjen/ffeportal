import { SignJWT, jwtVerify } from 'jose';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// Hashing Passwords
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT Token Management
interface UserPayload {
  id: string;
  email: string;
  role: 'admin' | 'client' | 'contractor';
}

export async function createToken(payload: UserPayload): Promise<string> {
  const JWT_SECRET = process.env.JWT_SECRET!;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + (60 * 60 * 24); // 1 day

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(new TextEncoder().encode(JWT_SECRET));
}

export async function verifyToken(token: string): Promise<UserPayload> {
  const JWT_SECRET = process.env.JWT_SECRET!;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));

  // Explicitly check for and extract the properties
  if (typeof payload.id !== 'string' || typeof payload.email !== 'string' || !['admin', 'client', 'contractor'].includes(payload.role as any)) {
    throw new Error('Invalid token payload');
  }

  return {
    id: payload.id,
    email: payload.email,
    role: payload.role as 'admin' | 'client' | 'contractor',
  };
}

// User fetching by token (for middleware/server components)
export async function getUserByToken(token: string) {
  try {
    const payload = await verifyToken(token);
    const [user] = await db.select().from(users).where(eq(users.id, payload.id));
    return user;
  } catch (error) {
    console.error('Error verifying token or fetching user:', error);
    return null;
  }
}