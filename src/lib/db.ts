import { Pool } from "pg";
import dns from "dns";

// Force IPv4 — DO App Platform resolves Supabase to IPv6 by default
dns.setDefaultResultOrder("ipv4first");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

export function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export default pool;
