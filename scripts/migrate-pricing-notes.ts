
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting migration to add project/client notes to pricing_entries...');
    await client.query('BEGIN');
    await client.query('ALTER TABLE "pricing_entries" ADD COLUMN IF NOT EXISTS "project_notes" text;');
    await client.query('ALTER TABLE "pricing_entries" ADD COLUMN IF NOT EXISTS "client_notes" text;');
    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

runMigration();
