import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 8000,
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
  console.error("[db] Pool error:", err.message);
});

export function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export default pool;
