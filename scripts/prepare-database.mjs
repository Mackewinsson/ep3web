/**
 * Bootstrap an empty Postgres for CI (and local e2e).
 * Applies drizzle/*.sql in journal order, then inserts the admin user.
 * Neon HTTP cannot run these files; this uses node-postgres.
 *
 *   DATABASE_URL=postgresql://ep3:ep3@localhost:5432/ep3 \
 *   ADMIN_EMAIL=admin@test.cl ADMIN_PASSWORD=ep3admin123 \
 *   node scripts/prepare-database.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import bcrypt from "bcryptjs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const root = new URL("..", import.meta.url).pathname;
const dir = join(root, "drizzle");
const files = readdirSync(dir)
  .filter((name) => /^\d+.+\.sql$/.test(name))
  .sort();

const client = new pg.Client({ connectionString: url });
await client.connect();

for (const file of files) {
  const chunks = readFileSync(join(dir, file), "utf8")
    .split("--> statement-breakpoint")
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  for (const statement of chunks) {
    await client.query(statement);
  }
  console.log(`applied ${file}`);
}

const email = (process.env.ADMIN_EMAIL ?? "admin@test.cl").toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "ep3admin123";
const hash = bcrypt.hashSync(password, 12);
await client.query(
  `INSERT INTO staff_users (email, name, password_hash, role, active)
   VALUES ($1, $2, $3, 'admin', true)
   ON CONFLICT (email) DO NOTHING`,
  [email, process.env.ADMIN_NAME ?? "Admin CI", hash],
);
console.log(`admin ready: ${email}`);

await client.end();
