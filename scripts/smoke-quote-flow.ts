import { config } from "dotenv";
import { asc, eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  budgetItems,
  budgets,
  clients,
  quoteRequests,
  servicePackages,
} from "../src/db/schema";

config({ path: ".env.local" });

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));
  const [pkg] = await db
    .select()
    .from(servicePackages)
    .orderBy(asc(servicePackages.sortOrder))
    .limit(1);
  if (!pkg) throw new Error("no package");

  const [client] = await db
    .insert(clients)
    .values({
      name: "Cliente Smoke Test",
      phone: "+56911112222",
      email: "smoke@example.com",
      notes: "smoke",
    })
    .returning();

  const [quote] = await db
    .insert(quoteRequests)
    .values({
      clientId: client.id,
      packageId: pkg.id,
      originAddress: "Providencia 100",
      destinationAddress: "Maipu 200",
      estimatedM3: "8",
      estimatedItems: 12,
      source: "website",
      status: "new",
    })
    .returning();

  const [budget] = await db
    .insert(budgets)
    .values({
      clientId: client.id,
      quoteRequestId: quote.id,
      title: "Smoke presupuesto",
      status: "draft",
    })
    .returning();

  const qty = pkg.pricingType === "m3" ? Number(quote.estimatedM3) : 1;
  await db.insert(budgetItems).values({
    budgetId: budget.id,
    packageId: pkg.id,
    description: pkg.name,
    pricingUnit: pkg.pricingType,
    quantity: String(qty),
    unitPrice: pkg.basePrice,
  });

  const total = (qty * Number(pkg.basePrice)).toFixed(2);
  await db
    .update(budgets)
    .set({ totalAmount: total })
    .where(eq(budgets.id, budget.id));
  await db
    .update(quoteRequests)
    .set({ status: "converted" })
    .where(eq(quoteRequests.id, quote.id));

  const [check] = await db
    .select()
    .from(budgets)
    .where(eq(budgets.id, budget.id));
  const items = await db
    .select()
    .from(budgetItems)
    .where(eq(budgetItems.budgetId, budget.id));

  console.log("SMOKE OK", {
    package: pkg.slug,
    quoteSource: quote.source,
    items: items.length,
    total: check.totalAmount,
    unit: items[0]?.pricingUnit,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
