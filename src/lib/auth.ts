import { SignJWT } from 'jose'; // Removed jwtVerify
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { verifyToken, UserPayload } from './auth-edge'; // Import verifyToken and UserPayload from auth-edge

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

// Hashing Passwords
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT Token Management (UserPayload is now imported)

export async function createToken(payload: UserPayload): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + (60 * 60 * 24); // 1 day

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(new TextEncoder().encode(JWT_SECRET));
}

// verifyToken function removed as it's in auth-edge.ts

// User fetching by token (for middleware/server components)
export async function getUserByToken(token: string) {
  try {
    const payload = await verifyToken(token); // Use verifyToken from auth-edge
    const [user] = await db.select().from(users).where(eq(users.id, payload.id));
    return user;
  } catch (error) {
    console.error('Error verifying token or fetching user:', error);
    return null;
  }
}