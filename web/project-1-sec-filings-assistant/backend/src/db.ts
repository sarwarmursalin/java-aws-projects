import { Pool } from "pg";

// Local dev uses DATABASE_URL (simple password, safe in a URL). The
// deployed environment instead sets PGHOST/PGUSER/PGPASSWORD/etc directly —
// pg reads those automatically, avoiding URL-encoding an auto-generated
// password that can contain characters a URL parser mishandles.
// RDS's default parameter group requires SSL — local Docker Postgres
// doesn't use it at all, so this only applies in the deployed case.
export const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : { ssl: { rejectUnauthorized: false } }
);
