import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting migration to add labor_requests table...');
    await client.query('BEGIN');

    // Create ENUM type if not exists
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "labor_request_status" AS ENUM ('pending', 'quoted', 'approved', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "labor_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "admin_id" uuid NOT NULL REFERENCES "users"("id"),
        "contractor_id" uuid NOT NULL REFERENCES "users"("id"),
        "request_id" uuid REFERENCES "requests"("id"),
        "message" text NOT NULL,
        "status" "labor_request_status" DEFAULT 'pending' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

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
