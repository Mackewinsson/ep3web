import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { budgetItems } from "@/db/schema";
import { ensureClientInventoryFromNotes } from "@/lib/budget-notes";
import {
  loadUnitVolumeResolver,
  parseStoredVolume,
} from "@/lib/volume-breakdown";

export type BudgetItemRow = {
  id: string;
  description: string;
  pricingUnit: "fixed" | "m3" | "unit";
  quantity: string;
  unitPrice: string;
  /** m³ per unit already resolved (stored value or catalog match). */
  resolvedVolumeM3: number | null;
};

export type BudgetItemsView = {
  rows: BudgetItemRow[];
  /** m³ charged on `m3` lines; null when the budget has none. */
  billedM3: number | null;
  /** The inventory was rebuilt from the wizard notes, so the budget changed. */
  hydrated: boolean;
};

/**
 * Editable rows of a budget, shared by the presupuesto page and the cotización
 * page so both render the same table from the same data.
 */
export async function loadBudgetItemsView(
  budgetId: string,
): Promise<BudgetItemsView> {
  const { hydrated } = await ensureClientInventoryFromNotes(budgetId);

  const [items, resolveVolume] = await Promise.all([
    db
      .select()
      .from(budgetItems)
      .where(eq(budgetItems.budgetId, budgetId))
      .orderBy(asc(budgetItems.sortOrder), asc(budgetItems.description)),
    loadUnitVolumeResolver(),
  ]);

  const rows: BudgetItemRow[] = items.map((item) => ({
    id: item.id,
    description: item.description,
    pricingUnit: item.pricingUnit,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    resolvedVolumeM3:
      item.pricingUnit === "unit"
        ? resolveVolume({
            description: item.description,
            unitVolumeM3: parseStoredVolume(item.unitVolumeM3),
          })
        : null,
  }));

  const m3Lines = items.filter((item) => item.pricingUnit === "m3");
  const billedM3 = m3Lines.length
    ? m3Lines.reduce((sum, item) => sum + Number(item.quantity), 0)
    : null;

  return { rows, billedM3, hydrated };
}
