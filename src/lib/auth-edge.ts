// src/lib/auth-edge.ts
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

// JWT Token Management
export interface UserPayload {
  id: string;
  email: string;
  role: 'admin' | 'client' | 'contractor';
}

export async function verifyToken(token: string): Promise<UserPayload> {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
  return payload as unknown as UserPayload;
}
