import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('DATABASE_URL is not set in .env.local');
}

console.log('Database URL found (first 10 chars):', dbUrl.substring(0, 10) + '...');

const config = defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl,
  },
  verbose: true,
  strict: true,
});

console.log('Config object created with keys:', Object.keys(config));
console.log('dbCredentials keys:', Object.keys(config.dbCredentials));

export default config;
