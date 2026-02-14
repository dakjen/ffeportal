// src/lib/auth-edge.ts
import { jwtVerify } from 'jose';

const jwtSecretEnv = process.env.JWT_SECRET; // Access without !

if (!jwtSecretEnv) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

const JWT_SECRET_UINT8 = new TextEncoder().encode(jwtSecretEnv); // Encode here

// JWT Token Management
export interface UserPayload {
  id: string;
  email: string;
  role: 'admin' | 'client' | 'contractor';
}

export async function verifyToken(token: string): Promise<UserPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET_UINT8); // Use pre-encoded secret
  return payload as unknown as UserPayload;
}