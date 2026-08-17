/**
 * Quote pricing & volume estimation — single source of truth.
 *
 * Agents and humans: change formulas HERE (and admin settings in DB), not in UI components.
 *
 * Flow:
 * 1) Catalog items each have volumeM3
 * 2) sumInventory() → furniture m³ + item count
 * 3) suggestBoxes() → packing boxes from furniture m³ + PricingConfig
 * 4) buildQuoteEstimate() → total m³, boxes, CLP line items for budget
 *
 * Config defaults live in DEFAULT_PRICING_CONFIG; production values come from
 * `quote_pricing_settings` (editable in /panel/cotizador by admin only).
 */

export type PricingConfig = {
  /** Boxes suggested ≈ ceil(furnitureM3 * boxesPerM3), floored by minBoxes */
  boxesPerM3: number;
  minBoxes: number;
  /** Volume attributed to each packing box */
  boxVolumeM3: number;
  /** Base CLP price charged per m³ of total volume */
  pricePerM3: number;
  /** Extra CLP per floor when apartment has no elevator */
  noElevatorPerFloor: number;
  /**
   * Percent of the client budget kept by admin.
   * Operator UI shows the remainder (e.g. 20 → operator sees 80%).
   */
  operatorMarginPercent: number;
  currency: "CLP";
};

export const DEFAULT_OPERATOR_MARGIN_PERCENT = 20;

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  boxesPerM3: 0.7,
  minBoxes: 6,
  boxVolumeM3: 0.08,
  pricePerM3: 25000,
  noElevatorPerFloor: 15000,
  operatorMarginPercent: DEFAULT_OPERATOR_MARGIN_PERCENT,
  currency: "CLP",
};

export function clampOperatorMarginPercent(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_OPERATOR_MARGIN_PERCENT;
  return Math.min(90, Math.max(0, value));
}

/** Amount the operator may see: client total minus admin margin. */
export function operatorPayoutFromClientTotal(
  clientTotal: number,
  marginPercent: number = DEFAULT_OPERATOR_MARGIN_PERCENT,
): number {
  const amount = Number(clientTotal);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const margin = clampOperatorMarginPercent(marginPercent);
  return Math.round(amount * (1 - margin / 100));
}

/** Drop quote-estimate price lines so operators never see the client total. */
export function stripClientPriceLines(
  notes: string | null | undefined,
): string | null {
  if (!notes) return null;
  const cleaned = notes
    .split("\n")
    .filter((line) => !/estimaci[oó]n auto:/i.test(line))
    .filter((line) => !/\$[\d.]+\s*CLP/i.test(line))
    .join("\n")
    .trim();
  return cleaned || null;
}

export type VolumeItem = {
  id: string;
  name: string;
  volumeM3: number;
};

export type InventoryLine = {
  itemId: string;
  name: string;
  quantity: number;
  unitVolumeM3: number;
  lineVolumeM3: number;
};

export type BudgetLineDraft = {
  description: string;
  pricingUnit: "fixed" | "m3" | "unit";
  quantity: number;
  unitPrice: number;
};

export type QuoteEstimate = {
  furnitureM3: number;
  packingBoxes: number;
  boxVolumeM3: number;
  totalM3: number;
  totalItems: number;
  inventoryLines: InventoryLine[];
  budgetLines: BudgetLineDraft[];
  totalAmount: number;
  config: PricingConfig;
};

export function sumInventory(
  quantities: Record<string, number>,
  items: VolumeItem[],
): { totalItems: number; furnitureM3: number; lines: InventoryLine[] } {
  const byId = new Map(items.map((i) => [i.id, i]));
  let totalItems = 0;
  let furnitureM3 = 0;
  const lines: InventoryLine[] = [];

  for (const [id, qty] of Object.entries(quantities)) {
    if (!qty || qty <= 0) continue;
    const item = byId.get(id);
    if (!item) continue;
    const lineVolumeM3 = qty * item.volumeM3;
    totalItems += qty;
    furnitureM3 += lineVolumeM3;
    lines.push({
      itemId: id,
      name: item.name,
      quantity: qty,
      unitVolumeM3: item.volumeM3,
      lineVolumeM3,
    });
  }

  lines.sort((a, b) => a.name.localeCompare(b.name, "es"));
  return { totalItems, furnitureM3, lines };
}

/** Suggest packing boxes from furniture volume only (not including boxes themselves). */
export function suggestBoxes(
  furnitureM3: number,
  config: PricingConfig = DEFAULT_PRICING_CONFIG,
): number {
  if (furnitureM3 <= 0) return config.minBoxes;
  return Math.max(
    config.minBoxes,
    Math.ceil(furnitureM3 * config.boxesPerM3),
  );
}

export function formatM3(value: number): string {
  const s = value.toFixed(2).replace(/\.?0+$/, "");
  return s || "0";
}

export type AccessSurchargeInput = {
  propertyType: string;
  floor: string;
  hasElevator: boolean | null;
};

function accessSurcharge(
  side: AccessSurchargeInput,
  config: PricingConfig,
): number {
  if (side.propertyType !== "departamento") return 0;
  if (side.hasElevator !== false) return 0;
  const floor = Number.parseInt(side.floor, 10);
  if (!Number.isFinite(floor) || floor <= 0) return 0;
  return floor * config.noElevatorPerFloor;
}

/**
 * Full estimate used by the public wizard (preview) and server submit (authoritative).
 */
export function buildQuoteEstimate(input: {
  quantities: Record<string, number>;
  items: VolumeItem[];
  packingBoxes: number;
  includeSuggestedBoxes?: boolean;
  config?: PricingConfig;
  origin?: AccessSurchargeInput;
  destination?: AccessSurchargeInput;
}): QuoteEstimate {
  const config = input.config ?? DEFAULT_PRICING_CONFIG;
  const { totalItems, furnitureM3, lines } = sumInventory(
    input.quantities,
    input.items,
  );

  const packingBoxes =
    input.includeSuggestedBoxes && input.packingBoxes <= 0
      ? suggestBoxes(furnitureM3, config)
      : Math.max(0, input.packingBoxes);

  const boxVolumeM3 = packingBoxes * config.boxVolumeM3;
  const totalM3 = furnitureM3 + boxVolumeM3;
  const itemsWithBoxes = totalItems + packingBoxes;

  const budgetLines: BudgetLineDraft[] = [];

  // One editable ops line per catalog item the client selected (price 0 until admin adjusts)
  for (const line of lines) {
    budgetLines.push({
      description: line.name,
      pricingUnit: "unit",
      quantity: line.quantity,
      unitPrice: 0,
    });
  }

  if (packingBoxes > 0) {
    budgetLines.push({
      description: "Caja de mudanza",
      pricingUnit: "unit",
      quantity: packingBoxes,
      unitPrice: 0,
    });
  }

  if (totalM3 > 0) {
    budgetLines.push({
      description: `Mudanza estimada (${formatM3(totalM3)} m³)`,
      pricingUnit: "m3",
      quantity: Number(totalM3.toFixed(2)),
      unitPrice: config.pricePerM3,
    });
  }

  const originFee = input.origin
    ? accessSurcharge(input.origin, config)
    : 0;
  const destFee = input.destination
    ? accessSurcharge(input.destination, config)
    : 0;

  if (originFee > 0) {
    budgetLines.push({
      description: `Recargo acceso origen (sin ascensor, piso ${input.origin?.floor})`,
      pricingUnit: "fixed",
      quantity: 1,
      unitPrice: originFee,
    });
  }
  if (destFee > 0) {
    budgetLines.push({
      description: `Recargo acceso destino (sin ascensor, piso ${input.destination?.floor})`,
      pricingUnit: "fixed",
      quantity: 1,
      unitPrice: destFee,
    });
  }

  const totalAmount = budgetLines.reduce((sum, line) => {
    const qty = line.pricingUnit === "fixed" ? 1 : line.quantity;
    return sum + qty * line.unitPrice;
  }, 0);

  return {
    furnitureM3,
    packingBoxes,
    boxVolumeM3,
    totalM3,
    totalItems: itemsWithBoxes,
    inventoryLines: lines,
    budgetLines,
    totalAmount,
    config,
  };
}
