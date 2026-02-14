
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkQuotes() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, status, request_id FROM quotes');
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
}

checkQuotes();
