import "dotenv/config";
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing in environment / .env.local");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log("Connected to database...");

  try {
    await client.query("BEGIN;");
    console.log("Truncating operational tables...");
    await client.query(`
      TRUNCATE TABLE 
        notifications, 
        job_assignments, 
        jobs, 
        budget_items, 
        budgets, 
        quote_requests, 
        clients;
    `);
    await client.query("COMMIT;");
    console.log("✓ Operational tables reset successfully (clients, quotes, budgets, jobs, assignments, notifications).");

    const counts = await client.query(`
      SELECT 'staff_users' as tbl, count(*) FROM staff_users
      UNION ALL SELECT 'drivers', count(*) FROM drivers
      UNION ALL SELECT 'trucks', count(*) FROM trucks
      UNION ALL SELECT 'service_packages', count(*) FROM service_packages
      UNION ALL SELECT 'moving_categories', count(*) FROM moving_categories
      UNION ALL SELECT 'moving_catalog_items', count(*) FROM moving_catalog_items
      UNION ALL SELECT 'quote_pricing_settings', count(*) FROM quote_pricing_settings
      UNION ALL SELECT 'clients', count(*) FROM clients
      UNION ALL SELECT 'quote_requests', count(*) FROM quote_requests
      UNION ALL SELECT 'budgets', count(*) FROM budgets
      UNION ALL SELECT 'jobs', count(*) FROM jobs;
    `);
    console.table(counts.rows);
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("Reset failed, rolled back:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);

