import { eq } from "drizzle-orm";
import { db } from "@/db";
import { budgetItems, budgets, quoteRequests } from "@/db/schema";
import { getPricingConfig } from "@/lib/moving-catalog-db";
import { formatM3, resolveQuotedClientTotal } from "@/lib/quote-pricing";

function sumItems(
  items: { quantity: string; unitPrice: string }[],
): number {
  return items.reduce((sum, item) => {
    const qty = Number(item.quantity);
    const price = Number(item.unitPrice);
    if (!Number.isFinite(qty) || !Number.isFinite(price)) return sum;
    return sum + qty * price;
  }, 0);
}

/**
 * If a budget has no money total, fill it from the linked quote
 * (Estimación auto or m³ × pricePerM3) so operators can see their 80% payout.
 */
export async function ensureBudgetQuotedTotal(
  budgetId: string,
): Promise<number | null> {
  const [budget] = await db
    .select()
    .from(budgets)
    .where(eq(budgets.id, budgetId))
    .limit(1);
  if (!budget) return null;

  const items = await db
    .select()
    .from(budgetItems)
    .where(eq(budgetItems.budgetId, budgetId));
  const fromItems = sumItems(items);
  if (fromItems > 0) {
    if (Number(budget.totalAmount) !== fromItems) {
      await db
        .update(budgets)
        .set({
          totalAmount: fromItems.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(budgets.id, budgetId));
    }
    return fromItems;
  }

  if (Number(budget.totalAmount) > 0) return Number(budget.totalAmount);

  let volumeNotes = budget.notes;
  let estimatedM3: string | null = null;
  if (budget.quoteRequestId) {
    const [quote] = await db
      .select({
        volumeNotes: quoteRequests.volumeNotes,
        estimatedM3: quoteRequests.estimatedM3,
      })
      .from(quoteRequests)
      .where(eq(quoteRequests.id, budget.quoteRequestId))
      .limit(1);
    if (quote) {
      volumeNotes = [quote.volumeNotes, budget.notes]
        .filter(Boolean)
        .join("\n");
      estimatedM3 = quote.estimatedM3;
    }
  }

  const pricing = await getPricingConfig();
  const total = resolveQuotedClientTotal({
    budgetTotal: budget.totalAmount,
    notes: volumeNotes,
    estimatedM3,
    pricePerM3: pricing.pricePerM3,
  });
  if (total == null || total <= 0) return null;

  const m3 = Number(String(estimatedM3 ?? "").replace(",", "."));
  const description =
    Number.isFinite(m3) && m3 > 0
      ? `Mudanza estimada (${formatM3(m3)} m³)`
      : "Mudanza estimada";

  await db.insert(budgetItems).values({
    budgetId,
    description,
    pricingUnit: "fixed",
    quantity: "1",
    unitPrice: String(total),
    sortOrder: items.length,
  });

  await db
    .update(budgets)
    .set({
      totalAmount: total.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(budgets.id, budgetId));

  return total;
}
