
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { requests, quotes } from './src/db/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const db = drizzle(pool);

async function listData() {
  console.log('--- REQUESTS TABLE ---');
  const allRequests = await db.select().from(requests);
  console.table(allRequests);

  console.log('\n--- QUOTES TABLE ---');
  const allQuotes = await db.select().from(quotes);
  console.table(allQuotes);
  
  process.exit(0);
}

listData().catch(console.error);

