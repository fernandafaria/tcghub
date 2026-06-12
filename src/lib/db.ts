import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  family: 4, // Force IPv4 — DO App Platform doesn't support IPv6 to Supabase
});

export function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export default pool;
