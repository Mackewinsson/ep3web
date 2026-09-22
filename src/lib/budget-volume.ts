import { eq } from "drizzle-orm";
import { db } from "@/db";
import { budgetItems } from "@/db/schema";
import { adjustM3Line, pickAutoM3Line } from "@/lib/quote-pricing";
import { loadVolumeCatalog } from "@/lib/volume-breakdown";

/**
 * Applies an inventory volume change to the billed m³ line
 * ("Mudanza estimada"), creating it at the configured m³ price if missing.
 */
export async function applyInventoryVolumeDelta(
  budgetId: string,
  deltaM3: number,
) {
  const rows = await db
    .select({
      id: budgetItems.id,
      description: budgetItems.description,
      pricingUnit: budgetItems.pricingUnit,
      quantity: budgetItems.quantity,
      sortOrder: budgetItems.sortOrder,
    })
    .from(budgetItems)
    .where(eq(budgetItems.budgetId, budgetId));

  const line = pickAutoM3Line(rows);
  const next = adjustM3Line({
    current: line
      ? { description: line.description, quantity: Number(line.quantity) }
      : null,
    deltaM3,
  });

  if (next.action === "none") return;

  if (next.action === "delete") {
    if (line) await db.delete(budgetItems).where(eq(budgetItems.id, line.id));
    return;
  }

  if (line) {
    await db
      .update(budgetItems)
      .set({ description: next.description, quantity: String(next.quantity) })
      .where(eq(budgetItems.id, line.id));
    return;
  }

  const { pricePerM3 } = await loadVolumeCatalog();
  const maxSort = rows.reduce((max, r) => Math.max(max, r.sortOrder), 0);
  await db.insert(budgetItems).values({
    budgetId,
    description: next.description,
    pricingUnit: "m3",
    quantity: String(next.quantity),
    unitPrice: String(pricePerM3),
    sortOrder: maxSort + 1,
  });
}
