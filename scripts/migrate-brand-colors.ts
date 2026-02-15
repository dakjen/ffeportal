import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting migration to add brand colors to users table...');
    await client.query('BEGIN');

    await client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "brand_color_primary" varchar(7) DEFAULT \'#710505\';');
    await client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "brand_color_secondary" varchar(7) DEFAULT \'#f0f0f0\';');

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
