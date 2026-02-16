// src/lib/auth-edge.ts
import { jwtVerify } from 'jose';

const jwtSecretEnv = process.env.JWT_SECRET;

export interface UserPayload {
  id: string;
  email: string;
  role: 'admin' | 'client' | 'contractor';
}

export async function verifyToken(token: string): Promise<UserPayload> {
  if (!jwtSecretEnv) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  const secretKey = new TextEncoder().encode(jwtSecretEnv);
  const { payload } = await jwtVerify(token, secretKey);
  return payload as unknown as UserPayload;
}