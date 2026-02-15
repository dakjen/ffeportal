import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting migration to add projects table and link requests with project_id...');
    await client.query('BEGIN');

    // Create projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "projects" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "client_id" uuid NOT NULL REFERENCES "users"("id"),
        "name" varchar(256) NOT NULL,
        "location" varchar(256),
        "description" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // Add project_id to requests table if it doesn't exist
    await client.query('ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "project_id" uuid;');
    
    // Add foreign key constraint to requests table if it doesn't exist
    // This is a bit tricky with IF NOT EXISTS for constraints, so check if constraint exists first
    const constraintCheck = await client.query(`
      SELECT conname FROM pg_constraint WHERE conrelid = '"requests"'::regclass AND contype = 'f' AND conname = 'requests_project_id_projects_id_fk';
    `);

    if (constraintCheck.rows.length === 0) {
      await client.query('ALTER TABLE "requests" ADD CONSTRAINT "requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;');
    }

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
