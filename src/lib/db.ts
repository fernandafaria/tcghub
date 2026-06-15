import { Pool } from "pg";

// Supabase IPv4 routes through Supavisor.
// Tenant reference must be passed as a startup parameter.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 8000,
  idleTimeoutMillis: 30000,
  options: "-c reference=qzriethxpgcsvgzdzifp",
});

pool.on("error", (err) => {
  console.error("[db] Pool error:", err.message);
});

export function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export default pool;
