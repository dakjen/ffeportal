import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting migration to update users and labor_requests...');
    await client.query('BEGIN');

    // Update users table
    await client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "license_number" varchar(256);');
    await client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "insurance_info" text;');
    await client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trades" text;'); // Storing as comma-separated string for simplicity
    await client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "website" varchar(256);');
    await client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "description" text;');
    await client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ein" varchar(256);'); // Added EIN as requested in previous prompt "like ein"

    // Create labor_request_progress enum
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "labor_request_progress" AS ENUM (
          'quote_sent', 
          'quote_accepted', 
          'timeline_developed', 
          'project_started', 
          'project_completed'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Update labor_requests table
    await client.query('ALTER TABLE "labor_requests" ADD COLUMN IF NOT EXISTS "progress" "labor_request_progress";');

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
