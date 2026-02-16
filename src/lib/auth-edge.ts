// src/lib/auth-edge.ts
import { jwtVerify } from 'jose';

const jwtSecretEnv = process.env.JWT_SECRET;

if (!jwtSecretEnv) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

// Convert the secret for Web Crypto API compatibility.
// This is crucial for Vercel Edge compatibility.
const getSecretKey = async () => {
  return new TextEncoder().encode(jwtSecretEnv);
};

let cachedSecretKey: Promise<Uint8Array | CryptoKey> | null = null;

export interface UserPayload {
  id: string;
  email: string;
  role: 'admin' | 'client' | 'contractor';
}

export async function verifyToken(token: string): Promise<UserPayload> {
  if (!cachedSecretKey) {
    cachedSecretKey = getSecretKey();
  }
  const secretKey = await cachedSecretKey;
  const { payload } = await jwtVerify(token, secretKey);
  return payload as unknown as UserPayload;
}