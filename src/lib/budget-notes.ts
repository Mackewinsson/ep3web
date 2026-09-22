import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { budgetItems, budgets, jobs, quoteRequests } from "@/db/schema";
import { notesContentEqual } from "@/lib/job-notes";
import {
  extractAutoEstimateM3,
  formatM3,
  syncBudgetItemsInNotes,
  type NotesBudgetItem,
} from "@/lib/quote-pricing";

function toNotesItem(row: {
  description: string;
  pricingUnit: "fixed" | "m3" | "unit";
  quantity: string;
}): NotesBudgetItem {
  return {
    description: row.description,
    pricingUnit: row.pricingUnit,
    quantity: Number(row.quantity),
  };
}

function positiveNumber(value: unknown): number | null {
  const n =
    typeof value === "string" ? Number(value.replace(",", ".")) : Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * budget_items is the source of truth for volume details.
 * Push Inventario / Cargos / Cajas / Estimación auto into quote.volumeNotes
 * and budget.notes. jobs.notes stay operational (empty unless admin writes).
 */
export async function syncLinkedNotesFromBudgetItems(budgetId: string) {
  const [budget] = await db
    .select()
    .from(budgets)
    .where(eq(budgets.id, budgetId))
    .limit(1);
  if (!budget) return { jobIds: [] as string[] };

  const rows = await db
    .select({
      description: budgetItems.description,
      pricingUnit: budgetItems.pricingUnit,
      quantity: budgetItems.quantity,
    })
    .from(budgetItems)
    .where(eq(budgetItems.budgetId, budgetId))
    .orderBy(asc(budgetItems.sortOrder), asc(budgetItems.description));

  const items = rows.map(toNotesItem);

  let estimatedM3 = extractAutoEstimateM3(budget.notes);

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
      estimatedM3 =
        extractAutoEstimateM3(quote.volumeNotes) ??
        positiveNumber(quote.estimatedM3) ??
        estimatedM3;
    }
  }

  const m3Item = items.find(
    (item) =>
      item.pricingUnit === "m3" &&
      Number.isFinite(item.quantity) &&
      item.quantity > 0,
  );
  if (m3Item) estimatedM3 = m3Item.quantity;

  const opts = {
    totalAmount: positiveNumber(budget.totalAmount),
    estimatedM3,
  };

  const nextBudgetNotes = syncBudgetItemsInNotes(budget.notes, items, opts);
  if (nextBudgetNotes !== (budget.notes ?? "").trim()) {
    await db
      .update(budgets)
      .set({
        notes: nextBudgetNotes || null,
        updatedAt: new Date(),
      })
      .where(eq(budgets.id, budgetId));
  }

  let nextQuoteNotes: string | null = null;
  if (budget.quoteRequestId) {
    const [quote] = await db
      .select({
        id: quoteRequests.id,
        volumeNotes: quoteRequests.volumeNotes,
        estimatedItems: quoteRequests.estimatedItems,
        estimatedM3: quoteRequests.estimatedM3,
      })
      .from(quoteRequests)
      .where(eq(quoteRequests.id, budget.quoteRequestId))
      .limit(1);
    if (quote) {
      nextQuoteNotes = syncBudgetItemsInNotes(
        quote.volumeNotes,
        items,
        opts,
      );
      const unitCount = items
        .filter((item) => item.pricingUnit === "unit")
        .reduce(
          (sum, item) =>
            sum + (Number.isFinite(item.quantity) ? item.quantity : 0),
          0,
        );
      await db
        .update(quoteRequests)
        .set({
          volumeNotes: nextQuoteNotes || null,
          estimatedItems:
            unitCount > 0 ? Math.round(unitCount) : quote.estimatedItems,
          estimatedM3:
            opts.estimatedM3 != null
              ? formatM3(opts.estimatedM3)
              : quote.estimatedM3,
          updatedAt: new Date(),
        })
        .where(eq(quoteRequests.id, quote.id));
    }
  }

  const volumeSnapshot = nextQuoteNotes || nextBudgetNotes;

  const jobRows = await db
    .select({ id: jobs.id, notes: jobs.notes })
    .from(jobs)
    .where(eq(jobs.budgetId, budgetId));

  for (const job of jobRows) {
    const isVolumeCopy =
      notesContentEqual(job.notes, volumeSnapshot) ||
      notesContentEqual(job.notes, nextBudgetNotes) ||
      notesContentEqual(job.notes, budget.notes);
    if (job.notes && isVolumeCopy) {
      await db
        .update(jobs)
        .set({ notes: null, updatedAt: new Date() })
        .where(eq(jobs.id, job.id));
    }
  }

  return { jobIds: jobRows.map((job) => job.id) };
}
