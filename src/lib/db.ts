import { Pool, type PoolConfig } from "pg";
import dns from "dns";

// Force IPv4 — DO App Platform resolves Supabase to IPv6 by default
dns.setDefaultResultOrder("ipv4first");

const poolConfig: PoolConfig & { family?: number } = {
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  family: 4, // Force IPv4 — DO App Platform can't reach Supabase IPv6
};

const pool = new Pool(poolConfig);

export function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export default pool;
