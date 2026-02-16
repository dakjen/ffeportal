// src/lib/auth-edge.ts
import { verify } from '@tsndr/cloudflare-worker-jwt';

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
  const payload = await verify(token, jwtSecretEnv);
  return payload as UserPayload;
}