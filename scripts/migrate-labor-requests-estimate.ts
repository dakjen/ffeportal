import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database...');

    console.log('Updating labor_requests table schema...');
    
    // Add columns to labor_requests
    await client.query(`
      ALTER TABLE "labor_requests" 
      ADD COLUMN IF NOT EXISTS "subtotal" numeric,
      ADD COLUMN IF NOT EXISTS "discount" numeric,
      ADD COLUMN IF NOT EXISTS "deposit_paid" numeric,
      ADD COLUMN IF NOT EXISTS "deposit_required" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "deposit_percentage" numeric;
    `);

    console.log('Creating labor_request_items table...');

    // Create labor_request_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "labor_request_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "labor_request_id" uuid NOT NULL REFERENCES "labor_requests"("id"),
        "service_name" varchar(256) NOT NULL,
        "description" text,
        "price" numeric NOT NULL,
        "quantity" numeric DEFAULT '1' NOT NULL,
        "total" numeric NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

main();