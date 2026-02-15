import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting migration to update invoices table...');
    await client.query('BEGIN');

    // Add client_id and contractor_email columns to invoices table
    await client.query('ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "client_id" uuid REFERENCES "users"("id");');
    await client.query('ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "client_email" varchar(256);');

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
