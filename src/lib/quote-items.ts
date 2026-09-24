import {
  buildVolumeBreakdown,
  parseCajasCount,
  parseInventarioEntries,
  type VolumeBreakdown,
} from "@/lib/quote-pricing";
import {
  getBudgetVolumeBreakdown,
  loadVolumeCatalog,
  parseStoredVolume,
} from "@/lib/volume-breakdown";

export type QuoteItemsView = {
  breakdown: VolumeBreakdown;
  source: "budget" | "notes";
};

/**
 * Items of a quote. The linked budget is the source of truth once it exists;
 * before that, the rows are read from the volume notes.
 */
export async function getQuoteItemsView(input: {
  budgetId: string | null;
  volumeNotes: string | null;
  estimatedM3: string | null;
}): Promise<QuoteItemsView> {
  if (input.budgetId) {
    return {
      source: "budget",
      breakdown: await getBudgetVolumeBreakdown(
        input.budgetId,
        input.estimatedM3,
      ),
    };
  }

  const { catalog, boxVolumeM3 } = await loadVolumeCatalog();
  const items = parseInventarioEntries(input.volumeNotes);
  const boxes = parseCajasCount(input.volumeNotes);
  if (boxes > 0) {
    items.push({
      description: "Caja de mudanza",
      pricingUnit: "unit",
      quantity: boxes,
    });
  }

  return {
    source: "notes",
    breakdown: buildVolumeBreakdown({
      items,
      catalog,
      boxVolumeM3,
      fallbackChargedM3: parseStoredVolume(input.estimatedM3),
    }),
  };
}
