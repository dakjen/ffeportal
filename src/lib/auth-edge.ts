// src/lib/auth-edge.ts
import { jwtVerify } from 'jose';

export interface UserPayload {
  id: string;
  email: string;
  role: 'admin' | 'client' | 'contractor';
}

export async function verifyToken(token: string): Promise<UserPayload> {
  const jwtSecretEnv = process.env.JWT_SECRET;
  if (!jwtSecretEnv) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const secretKey = new TextEncoder().encode(jwtSecretEnv);
  const { payload } = await jwtVerify(token, secretKey);

  if (!payload) {
    throw new Error('Invalid or expired token');
  }
  if (typeof (payload as any).id !== 'string' || typeof (payload as any).email !== 'string' || !['admin', 'client', 'contractor'].includes((payload as any).role)) {
    throw new Error('Invalid token payload structure');
  }

  return {
    id: (payload as any).id,
    email: (payload as any).email,
    role: (payload as any).role as 'admin' | 'client' | 'contractor',
  };
}