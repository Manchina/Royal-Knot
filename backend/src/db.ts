import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/royalknot',
});

export async function checkDatabaseConnection(): Promise<{ connected: boolean; version?: string; error?: string }> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    client.release();
    return {
      connected: true,
      version: result.rows[0]?.version,
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err.message || 'Unknown database connection error',
    };
  }
}
