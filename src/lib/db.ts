import { Pool } from "pg";
import dns from "dns";

// ─── Force IPv4 on DO App Platform ────────────────────────────────────────
// DO App Platform resolves Supabase pooler to IPv6 (2600:1f13:...) which is
// unreachable from their network. dns.setDefaultResultOrder doesn't suffice
// because the pg module calls dns.lookup with family=0 (any).
// We monkey-patch dns.lookup to always use family=4 (IPv4).
const _origLookup = dns.lookup;
(dns as any).lookup = (
  hostname: string,
  options: any,
  callback: any
) => {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  if (typeof options === "object") {
    options.family = 4;
  } else {
    options = { family: 4 };
  }
  return _origLookup(hostname, options, callback);
};

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
