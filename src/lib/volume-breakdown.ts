import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { budgetItems } from "@/db/schema";
import { getMovingCatalogForWizard } from "@/lib/moving-catalog-db";
import { buildVolumeBreakdown, type VolumeBreakdown } from "@/lib/quote-pricing";

/** Per-item m³ explanation for a budget (no prices — safe for operators). */
export async function getBudgetVolumeBreakdown(
  budgetId: string,
  fallbackChargedM3?: string | number | null,
): Promise<VolumeBreakdown> {
  const [rows, { catalog, pricing }] = await Promise.all([
    db
      .select({
        description: budgetItems.description,
        pricingUnit: budgetItems.pricingUnit,
        quantity: budgetItems.quantity,
      })
      .from(budgetItems)
      .where(eq(budgetItems.budgetId, budgetId))
      .orderBy(asc(budgetItems.sortOrder)),
    getMovingCatalogForWizard(),
  ]);

  const fallback =
    fallbackChargedM3 == null || fallbackChargedM3 === ""
      ? null
      : Number(fallbackChargedM3);

  return buildVolumeBreakdown({
    items: rows.map((r) => ({
      description: r.description,
      pricingUnit: r.pricingUnit,
      quantity: Number(r.quantity),
    })),
    catalog: catalog.categories.flatMap((c) => c.items),
    boxVolumeM3: pricing.boxVolumeM3,
    fallbackChargedM3: Number.isFinite(fallback) ? fallback : null,
  });
}
