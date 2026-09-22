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

export type HelpersOption =
  | "driver_only"
  | "driver_plus_1"
  | "driver_plus_2"
  | "driver_plus_3"
  | "none";

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
  /** Helper pricing: driver only (driver helps) */
  helperDriverOnly: number;
  /** Helper pricing: driver + 1 helper */
  helperDriverPlus1: number;
  /** Helper pricing: driver + 2 helpers */
  helperDriverPlus2: number;
  /** Helper pricing: driver + 3 helpers */
  helperDriverPlus3: number;
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
  helperDriverOnly: 30000,
  helperDriverPlus1: 60000,
  helperDriverPlus2: 90000,
  helperDriverPlus3: 120000,
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

export type QuotedClientTotalSources = {
  budgetTotal?: string | number | null;
  notes?: string | null;
  estimatedM3?: string | number | null;
  pricePerM3?: number;
};

/**
 * Client-facing quote total used as the base for operator payout.
 * Prefers the budget, then “Estimación auto” in notes, then m³ × pricePerM3.
 * Treats 0 / empty budget rows as missing so operators don’t see $0.
 */
export function resolveQuotedClientTotal(
  sources: QuotedClientTotalSources,
): number | null {
  const fromBudget = Number(sources.budgetTotal);
  if (Number.isFinite(fromBudget) && fromBudget > 0) return fromBudget;

  const fromNotes = extractAutoEstimateAmount(sources.notes);
  if (fromNotes != null && fromNotes > 0) return fromNotes;

  const rawM3 =
    typeof sources.estimatedM3 === "string"
      ? sources.estimatedM3.replace(",", ".")
      : sources.estimatedM3;
  const m3 = Number(rawM3);
  const price = sources.pricePerM3;
  if (Number.isFinite(m3) && m3 > 0 && price != null && price > 0) {
    return Math.round(m3 * price);
  }
  return null;
}

/** Operator payout from quote sources, or null when there is no quoted price. */
export function operatorPayoutFromQuoteSources(
  sources: QuotedClientTotalSources,
  marginPercent: number = DEFAULT_OPERATOR_MARGIN_PERCENT,
): number | null {
  const total = resolveQuotedClientTotal(sources);
  if (total == null) return null;
  const payout = operatorPayoutFromClientTotal(total, marginPercent);
  return payout > 0 ? payout : null;
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

/** Matches wizard / admin “Estimación auto: X m³ · $Y CLP” lines. */
const AUTO_ESTIMATE_LINE_RE =
  /Estimaci[oó]n auto:\s*([\d.,]+)\s*m³(?:\s*·\s*\$?([\d.]+)(?:\s*CLP)?)?/i;

function parseEsClAmount(raw: string): number {
  const n = Number(raw.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function formatEstimateAmountClp(amount: number): string {
  return `$${Math.round(amount).toLocaleString("es-CL")} CLP`;
}

/** Read m³ from an “Estimación auto” line in volume notes, if present. */
export function extractAutoEstimateM3(
  notes: string | null | undefined,
): number | null {
  if (!notes) return null;
  const match = notes.match(AUTO_ESTIMATE_LINE_RE);
  if (!match) return null;
  const n = Number(match[1].replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Read CLP amount from an “Estimación auto” line, if present. */
export function extractAutoEstimateAmount(
  notes: string | null | undefined,
): number | null {
  if (!notes) return null;
  const match = notes.match(AUTO_ESTIMATE_LINE_RE);
  if (!match?.[2]) return null;
  const n = parseEsClAmount(match[2]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Keep the “Estimación auto” line in sync with an edited m³ value.
 * Updates both the m³ figure and the money amount (`opts.amount` wins,
 * otherwise scaled from the previous ratio, otherwise `pricePerM3 * m3`).
 */
export function syncAutoEstimateInNotes(
  notes: string,
  m3: number,
  opts?: { pricePerM3?: number; amount?: number },
): string {
  if (!Number.isFinite(m3) || m3 <= 0) return notes;
  const m3Text = formatM3(m3);
  const match = notes.match(AUTO_ESTIMATE_LINE_RE);

  let amount: number | null = null;
  if (opts?.amount != null && Number.isFinite(opts.amount) && opts.amount > 0) {
    amount = Math.round(opts.amount);
  } else if (match?.[2]) {
    const oldM3 = Number(match[1].replace(",", "."));
    const oldAmount = parseEsClAmount(match[2]);
    if (Number.isFinite(oldM3) && oldM3 > 0 && Number.isFinite(oldAmount)) {
      amount = Math.round(oldAmount * (m3 / oldM3));
    }
  }
  if (amount == null && opts?.pricePerM3 != null && opts.pricePerM3 > 0) {
    amount = Math.round(m3 * opts.pricePerM3);
  }

  const line =
    amount != null
      ? `Estimación auto: ${m3Text} m³ · ${formatEstimateAmountClp(amount)}`
      : `Estimación auto: ${m3Text} m³`;

  if (!match) {
    const trimmed = notes.trim();
    return trimmed ? `${trimmed}\n${line}` : line;
  }
  // Function replacer: dollar amounts must not be treated as `$n` substitutions.
  return notes.replace(AUTO_ESTIMATE_LINE_RE, () => line);
}

export type NotesBudgetItem = {
  description: string;
  pricingUnit: "fixed" | "m3" | "unit";
  quantity: number;
};

function isPackingBoxItem(description: string) {
  return /^cajas? de mudanza$/i.test(description.trim());
}

const INVENTARIO_HEADER_RE = /^Inventario:\s*(.*)$/i;
const INVENTARIO_ENTRY_RE = /(\d+)\s*[×xX]\s*([^,]+)/g;
const NOTES_SECTION_HEADER_RE =
  /^(Origen|Destino|Ayudantes|Delicados|Cajas|Cargos|Estimaci[oó]n auto|Notas cliente|Hora preferida|Inventario)\s*:/i;

export function normalizeInventoryName(name: string) {
  return name
    .replace(/[×xX]/g, "x")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function parseInventarioList(text: string): NotesBudgetItem[] {
  const entries: NotesBudgetItem[] = [];
  const re = new RegExp(INVENTARIO_ENTRY_RE.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const quantity = Number(match[1]);
    const name = match[2].trim();
    if (!name || name === "—") continue;
    entries.push({
      description: name,
      pricingUnit: "unit",
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    });
  }
  return entries;
}

/** Parse `Inventario: 2× Sofá, 1× Silla` (and following item lines) from notes. */
export function parseInventarioEntries(
  notes: string | null | undefined,
): NotesBudgetItem[] {
  if (!notes) return [];
  const lines = notes.split("\n");
  const found: NotesBudgetItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const header = lines[i].match(INVENTARIO_HEADER_RE);
    if (!header) continue;
    const rest = header[1].trim();
    if (rest && rest !== "—") found.push(...parseInventarioList(rest));
    for (let j = i + 1; j < lines.length; j++) {
      const cont = lines[j].trim();
      if (!cont) break;
      if (NOTES_SECTION_HEADER_RE.test(cont)) break;
      found.push(...parseInventarioList(cont));
    }
  }

  const byName = new Map<string, NotesBudgetItem>();
  for (const entry of found) {
    const key = normalizeInventoryName(entry.description);
    if (!key) continue;
    const prev = byName.get(key);
    if (!prev || entry.quantity > prev.quantity) byName.set(key, entry);
  }
  return [...byName.values()];
}

export function inventoryItemsMissingFromBudget(
  notes: string | null | undefined,
  items: NotesBudgetItem[],
): NotesBudgetItem[] {
  const present = new Set(
    items
      .filter(
        (item) =>
          item.pricingUnit === "unit" &&
          !isPackingBoxItem(item.description),
      )
      .map((item) => normalizeInventoryName(item.description)),
  );
  return parseInventarioEntries(notes).filter(
    (entry) => !present.has(normalizeInventoryName(entry.description)),
  );
}

function mergeUnitInventory(
  fromItems: NotesBudgetItem[],
  notes: string | null | undefined,
  mergeFromNotes: boolean,
): NotesBudgetItem[] {
  const byName = new Map<string, NotesBudgetItem>();
  for (const item of fromItems) {
    const key = normalizeInventoryName(item.description);
    if (key) byName.set(key, item);
  }
  if (mergeFromNotes) {
    for (const entry of parseInventarioEntries(notes)) {
      const key = normalizeInventoryName(entry.description);
      if (key && !byName.has(key)) byName.set(key, entry);
    }
  }
  return [...byName.values()];
}

function isPrimaryM3Estimate(description: string, pricingUnit: string) {
  return pricingUnit === "m3" && /mudanza estimada/i.test(description);
}

export function formatBudgetItemNoteLabel(item: NotesBudgetItem): string {
  const name = item.description.trim() || "Ítem";
  const qty = item.quantity;
  if (item.pricingUnit === "m3") {
    if (Number.isFinite(qty) && qty > 0) {
      return `${name} (${formatM3(qty)} m³)`;
    }
    return name;
  }
  if (item.pricingUnit === "fixed") return name;
  const n = Number.isFinite(qty) && qty > 0 ? qty : 1;
  return `${n}× ${name}`;
}

const INVENTARIO_LINE_RE = /^Inventario:\s*.*$/im;
const CARGOS_LINE_RE = /^Cargos:\s*.*$/im;
const CAJAS_LINE_RE = /^Cajas:\s*.*$/im;
const AUTO_LINE_ANCHOR_RE = /^(Estimaci[oó]n auto:.*)$/im;

function collapseInventarioBlock(notes: string): string {
  const lines = notes.split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    out.push(lines[i]);
    if (!INVENTARIO_HEADER_RE.test(lines[i])) continue;
    while (i + 1 < lines.length) {
      const cont = lines[i + 1].trim();
      if (!cont) break;
      if (NOTES_SECTION_HEADER_RE.test(cont)) break;
      i += 1;
    }
  }
  return out.join("\n");
}

function upsertNotesLine(
  notes: string,
  lineRe: RegExp,
  line: string | null,
): string {
  if (!line) {
    return notes.replace(lineRe, "").replace(/\n{3,}/g, "\n\n").trim();
  }
  if (lineRe.test(notes)) {
    return notes.replace(lineRe, () => line);
  }
  if (AUTO_LINE_ANCHOR_RE.test(notes)) {
    return notes.replace(AUTO_LINE_ANCHOR_RE, (match) => `${line}\n${match}`);
  }
  const trimmed = notes.trim();
  return trimmed ? `${trimmed}\n${line}` : line;
}

/**
 * Rebuild Inventario / Cargos / Cajas / Estimación auto from budget_items.
 * Other note lines (origen, ayudantes, notas cliente, …) are kept.
 * By default, Inventario also keeps names that only exist in the notes
 * (client wizard list) so adding a manual line cannot wipe that detail.
 */
export function syncBudgetItemsInNotes(
  notes: string | null | undefined,
  items: NotesBudgetItem[],
  opts?: {
    totalAmount?: number | null;
    estimatedM3?: number | null;
    mergeInventory?: boolean;
  },
): string {
  const valid = items.filter((item) => item.description?.trim());
  const unitItems = valid.filter((item) => item.pricingUnit === "unit");
  const inventoryItems = mergeUnitInventory(
    unitItems.filter((item) => !isPackingBoxItem(item.description)),
    notes,
    opts?.mergeInventory !== false,
  );
  const boxItems = unitItems.filter((item) => isPackingBoxItem(item.description));
  const chargeItems = valid.filter(
    (item) =>
      item.pricingUnit !== "unit" &&
      !isPrimaryM3Estimate(item.description, item.pricingUnit),
  );

  const inventorySummary = inventoryItems.length
    ? inventoryItems.map(formatBudgetItemNoteLabel).join(", ")
    : "—";
  const cargosSummary = chargeItems
    .map(formatBudgetItemNoteLabel)
    .join(", ");
  const boxQty = boxItems.reduce((sum, item) => {
    return sum + (Number.isFinite(item.quantity) ? item.quantity : 0);
  }, 0);

  let next = collapseInventarioBlock(notes ?? "");
  next = upsertNotesLine(
    next,
    INVENTARIO_LINE_RE,
    `Inventario: ${inventorySummary}`,
  );
  next = upsertNotesLine(
    next,
    CARGOS_LINE_RE,
    cargosSummary ? `Cargos: ${cargosSummary}` : null,
  );
  next = upsertNotesLine(
    next,
    CAJAS_LINE_RE,
    boxQty > 0 ? `Cajas: ${boxQty}` : null,
  );

  const m3 =
    opts?.estimatedM3 != null &&
    Number.isFinite(opts.estimatedM3) &&
    opts.estimatedM3 > 0
      ? opts.estimatedM3
      : extractAutoEstimateM3(next);
  const total =
    opts?.totalAmount != null &&
    Number.isFinite(opts.totalAmount) &&
    opts.totalAmount > 0
      ? opts.totalAmount
      : null;

  if (m3 != null) {
    next = syncAutoEstimateInNotes(next, m3, {
      amount: total ?? undefined,
    });
  }

  return next.replace(/\n{3,}/g, "\n\n").trim();
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

function helperCharge(helpers: HelpersOption | undefined, config: PricingConfig): number {
  if (!helpers || helpers === "none") return 0;
  switch (helpers) {
    case "driver_only":
      return config.helperDriverOnly;
    case "driver_plus_1":
      return config.helperDriverPlus1;
    case "driver_plus_2":
      return config.helperDriverPlus2;
    case "driver_plus_3":
      return config.helperDriverPlus3;
    default:
      return 0;
  }
}

function helperLabel(helpers: HelpersOption): string {
  switch (helpers) {
    case "driver_only":
      return "Ayuda chofer";
    case "driver_plus_1":
      return "Ayuda chofer y ayudante";
    case "driver_plus_2":
      return "Ayuda chofer y 2 ayudantes";
    case "driver_plus_3":
      return "Ayuda chofer y 3 ayudantes";
    default:
      return "Sin ayudante";
  }
}

export type VolumeBreakdownLine = {
  name: string;
  quantity: number;
  isPackingBox: boolean;
  /** null when the item is not in the catalog (manual / custom lines). */
  unitVolumeM3: number | null;
  lineVolumeM3: number | null;
};

export type VolumeBreakdown = {
  lines: VolumeBreakdownLine[];
  catalogM3: number;
  /** m³ billed on the budget (m³ lines), or the quote estimate when none. */
  chargedM3: number | null;
  /** chargedM3 not explained by catalog volumes (custom items, manual adjustments). */
  unexplainedM3: number;
  totalItems: number;
};

/**
 * Explains where budget m³ come from: unit lines matched to catalog volumes,
 * packing boxes at the configured box volume, and the billed m³ total.
 */
export function buildVolumeBreakdown(input: {
  items: NotesBudgetItem[];
  catalog: Pick<VolumeItem, "name" | "volumeM3">[];
  boxVolumeM3: number;
  fallbackChargedM3?: number | null;
}): VolumeBreakdown {
  const volumeByName = new Map(
    input.catalog.map((c) => [normalizeInventoryName(c.name).toLowerCase(), c.volumeM3]),
  );

  const lines: VolumeBreakdownLine[] = [];
  let catalogM3 = 0;
  let totalItems = 0;
  let m3Lines = 0;
  let hasM3Line = false;

  for (const item of input.items) {
    if (item.pricingUnit === "m3") {
      hasM3Line = true;
      m3Lines += item.quantity;
      continue;
    }
    if (item.pricingUnit !== "unit" || item.quantity <= 0) continue;

    const isPackingBox = isPackingBoxItem(item.description);
    const unit = isPackingBox
      ? input.boxVolumeM3
      : volumeByName.get(normalizeInventoryName(item.description).toLowerCase()) ?? null;
    const lineVolume = unit == null ? null : unit * item.quantity;
    if (lineVolume != null) catalogM3 += lineVolume;
    totalItems += item.quantity;
    lines.push({
      name: item.description,
      quantity: item.quantity,
      isPackingBox,
      unitVolumeM3: unit,
      lineVolumeM3: lineVolume,
    });
  }

  lines.sort((a, b) => {
    if (a.isPackingBox !== b.isPackingBox) return a.isPackingBox ? 1 : -1;
    return a.name.localeCompare(b.name, "es");
  });

  const chargedM3 = hasM3Line ? m3Lines : (input.fallbackChargedM3 ?? null);
  const unexplainedM3 =
    chargedM3 == null ? 0 : Math.max(0, Number((chargedM3 - catalogM3).toFixed(2)));

  return {
    lines,
    catalogM3: Number(catalogM3.toFixed(2)),
    chargedM3,
    unexplainedM3,
    totalItems,
  };
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
  helpers?: HelpersOption;
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

  const helpersFee = input.helpers ? helperCharge(input.helpers, config) : 0;
  if (helpersFee > 0 && input.helpers && input.helpers !== "none") {
    budgetLines.push({
      description: helperLabel(input.helpers),
      pricingUnit: "fixed",
      quantity: 1,
      unitPrice: helpersFee,
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
