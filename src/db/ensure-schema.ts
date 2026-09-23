import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Idempotent DDL applied at server startup so code never runs against a
 * database missing recently added columns. Only statements safe to re-run
 * (IF NOT EXISTS) belong here; mirrors drizzle/0010 and drizzle/0011.
 */
const IDEMPOTENT_STATEMENTS = [
  `ALTER TABLE "quote_pricing_settings" ADD COLUMN IF NOT EXISTS "helper_driver_only" numeric(14, 2) DEFAULT '30000' NOT NULL`,
  `ALTER TABLE "quote_pricing_settings" ADD COLUMN IF NOT EXISTS "helper_driver_plus_1" numeric(14, 2) DEFAULT '60000' NOT NULL`,
  `ALTER TABLE "quote_pricing_settings" ADD COLUMN IF NOT EXISTS "helper_driver_plus_2" numeric(14, 2) DEFAULT '90000' NOT NULL`,
  `ALTER TABLE "quote_pricing_settings" ADD COLUMN IF NOT EXISTS "helper_driver_plus_3" numeric(14, 2) DEFAULT '120000' NOT NULL`,
  `ALTER TABLE "budget_items" ADD COLUMN IF NOT EXISTS "unit_volume_m3" numeric(10, 3)`,
];

export async function ensureDbSchema() {
  if (!process.env.DATABASE_URL) return;
  for (const statement of IDEMPOTENT_STATEMENTS) {
    try {
      await db.execute(sql.raw(statement));
    } catch (error) {
      console.error("[ensure-db-schema] failed:", statement, error);
    }
  }
}
