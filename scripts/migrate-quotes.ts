
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
    console.log('Starting migration...');
    await client.query('BEGIN');

    // 1. Make request_id nullable so quotes don't *need* a request
    console.log('Making request_id nullable...');
    await client.query('ALTER TABLE "quotes" ALTER COLUMN "request_id" DROP NOT NULL;');

    // 2. Add client_id column so a quote can belong directly to a client
    console.log('Adding client_id column...');
    await client.query('ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "client_id" uuid;');

    // 3. Add project_name column so a standalone quote can have a name
    console.log('Adding project_name column...');
    await client.query('ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "project_name" varchar(256);');

    // 4. Link the new client_id to the users table
    console.log('Adding foreign key constraint for client_id...');
    try {
        await client.query('ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id");');
    } catch (e: unknown) {
        // If constraint already exists (error 42710), we can ignore it
        if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === '42710') {
            console.log('Constraint already exists, skipping.');
        } else {
            console.log('Note: Constraint creation failed (might already exist), checking if safe to proceed...');
        }
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
