import { Pool } from "pg";

// @ts-expect-error - pg PoolConfig doesn't expose 'family' in types but it works at runtime
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  family: 4, // Force IPv4
});

export function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export default pool;
