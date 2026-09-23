/**
 * Applies idempotent (IF NOT EXISTS) migrations before `next build`, so a
 * deploy never ships code that queries columns the database doesn't have yet.
 * Only list migrations here that are safe to re-run on every build.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const IDEMPOTENT_MIGRATIONS = [
  "0010_amused_queen_noir.sql",
  "0011_budget_item_volume.sql",
];

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("[ensure-db-schema] DATABASE_URL not set — skipping.");
    return;
  }

  const sql = neon(url);
  for (const file of IDEMPOTENT_MIGRATIONS) {
    const text = await readFile(path.join(root, "drizzle", file), "utf8");
    const statements = text
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const statement of statements) {
      await sql.query(statement);
    }
    console.log(`[ensure-db-schema] applied ${file}`);
  }
}

main().catch((error) => {
  console.error("[ensure-db-schema] failed:", error);
  process.exit(1);
});
