import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { budgetItems, budgets, jobs, quoteRequests } from "@/db/schema";
import { notesContentEqual } from "@/lib/job-notes";
import {
  clientMessageFromNotes,
  extractAutoEstimateM3,
  formatM3,
  inventoryItemsMissingFromBudget,
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

async function loadBudgetItemRows(budgetId: string) {
  return db
    .select({
      description: budgetItems.description,
      pricingUnit: budgetItems.pricingUnit,
      quantity: budgetItems.quantity,
      sortOrder: budgetItems.sortOrder,
    })
    .from(budgetItems)
    .where(eq(budgetItems.budgetId, budgetId))
    .orderBy(asc(budgetItems.sortOrder), asc(budgetItems.description));
}

export type SyncLinkedNotesOptions = {
  /** Insert client Inventario names that exist in notes but not as unit rows. */
  hydrateFromNotes?: boolean;
  /** Keep notes-only inventory names when rewriting the Inventario line. */
  mergeInventory?: boolean;
};

/**
 * budget_items is the source of truth for volume details, plus any client
 * Inventario still living only in notes (wizard summary).
 * Push Inventario / Cargos / Cajas / Estimación auto into quote.volumeNotes,
 * which stays the machine-readable snapshot. budget.notes is reduced to the
 * admin's message for the client. jobs.notes stay operational (empty unless
 * admin writes).
 */
export async function syncLinkedNotesFromBudgetItems(
  budgetId: string,
  options: SyncLinkedNotesOptions = {},
) {
  const hydrateFromNotes = options.hydrateFromNotes ?? true;
  const mergeInventory = options.mergeInventory ?? true;

  const [budget] = await db
    .select()
    .from(budgets)
    .where(eq(budgets.id, budgetId))
    .limit(1);
  if (!budget) return { jobIds: [] as string[] };

  let itemRows = await loadBudgetItemRows(budgetId);
  let items = itemRows.map(toNotesItem);

  let quoteVolumeNotes: string | null = null;
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
      quoteVolumeNotes = quote.volumeNotes;
      estimatedM3 =
        extractAutoEstimateM3(quote.volumeNotes) ??
        positiveNumber(quote.estimatedM3) ??
        estimatedM3;
    }
  }

  const notesForInventory = [quoteVolumeNotes, budget.notes]
    .filter(Boolean)
    .join("\n");

  if (hydrateFromNotes) {
    const missing = inventoryItemsMissingFromBudget(notesForInventory, items);
    if (missing.length) {
      const maxSort =
        itemRows.reduce(
          (max, row) => Math.max(max, row.sortOrder ?? 0),
          -1,
        ) + 1;
      await db.insert(budgetItems).values(
        missing.map((item, index) => ({
          budgetId,
          description: item.description.slice(0, 300),
          pricingUnit: "unit" as const,
          quantity: String(item.quantity),
          unitPrice: "0",
          sortOrder: maxSort + index,
        })),
      );
      itemRows = await loadBudgetItemRows(budgetId);
      items = itemRows.map(toNotesItem);
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
    mergeInventory,
  };

  // The item table now shows inventory, boxes, charges and the estimate, so
  // budget.notes keeps only what the admin wrote for the client (it is the
  // text appended to the quote email). The machine-readable snapshot stays in
  // quote_requests.volumeNotes below.
  const generatedBudgetNotes = syncBudgetItemsInNotes(budget.notes, items, opts);
  const nextBudgetNotes = clientMessageFromNotes(budget.notes);
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

  const volumeSnapshot = nextQuoteNotes || generatedBudgetNotes;

  const jobRows = await db
    .select({ id: jobs.id, notes: jobs.notes })
    .from(jobs)
    .where(eq(jobs.budgetId, budgetId));

  for (const job of jobRows) {
    const isVolumeCopy =
      notesContentEqual(job.notes, volumeSnapshot) ||
      notesContentEqual(job.notes, generatedBudgetNotes) ||
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

/** Restore client Inventario rows when they still exist in notes but not as items. */
export async function ensureClientInventoryFromNotes(budgetId: string) {
  const [budget] = await db
    .select({
      notes: budgets.notes,
      quoteRequestId: budgets.quoteRequestId,
    })
    .from(budgets)
    .where(eq(budgets.id, budgetId))
    .limit(1);
  if (!budget) return { hydrated: false, jobIds: [] as string[] };

  const itemRows = await loadBudgetItemRows(budgetId);
  let quoteVolumeNotes: string | null = null;
  if (budget.quoteRequestId) {
    const [quote] = await db
      .select({ volumeNotes: quoteRequests.volumeNotes })
      .from(quoteRequests)
      .where(eq(quoteRequests.id, budget.quoteRequestId))
      .limit(1);
    quoteVolumeNotes = quote?.volumeNotes ?? null;
  }

  const missing = inventoryItemsMissingFromBudget(
    [quoteVolumeNotes, budget.notes].filter(Boolean).join("\n"),
    itemRows.map(toNotesItem),
  );
  if (!missing.length) return { hydrated: false, jobIds: [] as string[] };

  const result = await syncLinkedNotesFromBudgetItems(budgetId);
  return { hydrated: true, ...result };
}
