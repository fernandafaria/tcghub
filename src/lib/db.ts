import { Pool } from "pg";

// Supabase IPv4 routes through Supavisor — tenant reference must be
// passed via connection string options parameter.
const PROJECT_REF = "qzriethxpgcsvgzdzifp";

function buildConnectionString(): string {
  const base = process.env.DATABASE_URL || "";
  if (!base) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}options=--reference%3D${PROJECT_REF}`;
}

const pool = new Pool({
  connectionString: buildConnectionString(),
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
