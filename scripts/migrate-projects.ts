import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting migration to add projects table and link requests...');
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

    // Add projectId to requests table
    await client.query('ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "project_id" uuid;');
    await client.query('ALTER TABLE "requests" ADD CONSTRAINT "requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;');

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
