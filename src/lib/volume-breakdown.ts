import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { budgetItems } from "@/db/schema";
import { getMovingCatalogForWizard } from "@/lib/moving-catalog-db";
import {
  buildVolumeBreakdown,
  createUnitVolumeResolver,
  type VolumeBreakdown,
  type VolumeCatalogEntry,
} from "@/lib/quote-pricing";

export async function loadVolumeCatalog(): Promise<{
  catalog: VolumeCatalogEntry[];
  boxVolumeM3: number;
  pricePerM3: number;
}> {
  const { catalog, pricing } = await getMovingCatalogForWizard();
  return {
    catalog: catalog.categories.flatMap((c) => c.items),
    boxVolumeM3: pricing.boxVolumeM3,
    pricePerM3: pricing.pricePerM3,
  };
}

export async function loadUnitVolumeResolver() {
  const { catalog, boxVolumeM3 } = await loadVolumeCatalog();
  return createUnitVolumeResolver(catalog, boxVolumeM3);
}

export function parseStoredVolume(value: string | null | undefined) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Per-item m³ explanation for a budget (no prices — safe for operators). */
export async function getBudgetVolumeBreakdown(
  budgetId: string,
  fallbackChargedM3?: string | number | null,
): Promise<VolumeBreakdown> {
  const [rows, { catalog, boxVolumeM3 }] = await Promise.all([
    db
      .select({
        description: budgetItems.description,
        pricingUnit: budgetItems.pricingUnit,
        quantity: budgetItems.quantity,
        unitVolumeM3: budgetItems.unitVolumeM3,
      })
      .from(budgetItems)
      .where(eq(budgetItems.budgetId, budgetId))
      .orderBy(asc(budgetItems.sortOrder)),
    loadVolumeCatalog(),
  ]);

  const fallback = parseStoredVolume(
    fallbackChargedM3 == null ? null : String(fallbackChargedM3),
  );

  return buildVolumeBreakdown({
    items: rows.map((r) => ({
      description: r.description,
      pricingUnit: r.pricingUnit,
      quantity: Number(r.quantity),
      unitVolumeM3: parseStoredVolume(r.unitVolumeM3),
    })),
    catalog,
    boxVolumeM3,
    fallbackChargedM3: fallback,
  });
}
