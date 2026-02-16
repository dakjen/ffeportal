// src/lib/auth-edge.ts
import { jwtVerify, importJWK, type JWK } from 'jose';

const jwtSecretEnv = process.env.JWT_SECRET;

if (!jwtSecretEnv) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

// Convert the secret to a CryptoKey using Web Crypto API
// This is crucial for Vercel Edge compatibility.
const getSecretKey = async () => {
  // Use a simple JWK representation for HMAC.
  // The 'k' parameter is the base64url encoded symmetric key.
  const jwk: JWK = {
    kty: 'oct', // Octet sequence (symmetric key)
    k: Buffer.from(jwtSecretEnv).toString('base64url'),
    alg: 'HS256', // Algorithm used for signing/verification
  };
  return await importJWK(jwk, 'HS256');
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