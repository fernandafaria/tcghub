import { Pool } from "pg";

// Supabase IPv4 routes through Supavisor — must pass project reference.
// The direct hostname (db.[ref].supabase.co) with IPv4 add-on goes through
// Supavisor pooler, which requires the tenant reference.
const PROJECT_REF = "qzriethxpgcsvgzdzifp";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 8000,
  idleTimeoutMillis: 30000,
  options: `--reference=${PROJECT_REF}`,
});

pool.on("error", (err) => {
  console.error("[db] Pool error:", err.message);
});

export function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export default pool;
