# Quote pricing (agents)

**Single source of truth:** [`src/lib/quote-pricing/calculate.ts`](calculate.ts)

Do **not** duplicate box/volume/price formulas in React components. Import from this module.

Root product flows (roles, accept, job lifecycle): [`/AGENTS.md`](../../../AGENTS.md).

## Functions

| Function | Purpose |
|---|---|
| `sumInventory(quantities, items)` | Furniture m³ + lines from catalog quantities |
| `suggestBoxes(furnitureM3, config)` | Packing box count |
| `buildQuoteEstimate({...})` | Totals + budget line drafts (CLP) |
| `operatorPayoutFromClientTotal(total, margin%)` | Amount shown to operators (client total minus admin margin) |
| `operatorPayoutFromQuoteSources(...)` | Same payout, resolving $0 budgets from estimación auto / m³ |
| `resolveQuotedClientTotal(...)` | Client quote total: budget → estimación auto → m³ × price |
| `extractAutoEstimateAmount(notes)` | Parse CLP from an “Estimación auto” line |
| `stripClientPriceLines(notes)` | Remove estimate/$ CLP lines from operator-facing notes |
| `syncAutoEstimateInNotes(notes, m3, opts?)` | Keep “Estimación auto” m³ + amount in sync when admin edits m³ |
| `syncBudgetItemsInNotes` | Rebuild Inventario / Cargos / Cajas / Estimación auto from `budget_items`, **merging** client Inventario still in notes. Applies to `quote_requests.volumeNotes` only |
| `parseNotesSections(notes)` | Split notes into the client's wizard answers (`service`) and the admin's own text (`freeText`); drops the lines the item table already shows |
| `serviceDetailsFromNotes` / `clientMessageFromNotes` | The two halves of `parseNotesSections`, used by «Detalles del servicio» and «Mensaje para el cliente» |
| `extractAutoEstimateM3(notes)` | Parse m³ from an “Estimación auto” line |
| `createUnitVolumeResolver(catalog, boxVolumeM3)` | m³/unit for a budget line: stored `budget_items.unitVolumeM3` → packing box → catalog by name |
| `budgetItemVolumeM3(item, resolve)` | m³ a line contributes (only `unit` lines) |
| `adjustM3Line` / `pickAutoM3Line` | Apply an inventory m³ delta to the billed “Mudanza estimada” line (admin edits to that line are kept) |
| `buildVolumeBreakdown(...)` | Per-item m³ table for presupuesto / trabajo / mis-trabajos (no prices) |
| `DEFAULT_PRICING_CONFIG` | Fallback when DB settings missing (`operatorMarginPercent` default **20**) |

## Config (admin)

Table `quote_pricing_settings` edited at `/panel/cotizador` (admin only):

- `boxesPerM3`, `minBoxes`, `boxVolumeM3`
- `pricePerM3`, `noElevatorPerFloor`, `operatorMarginPercent` (app commission; operator sees `100 − margin`% of the quoted price)

Quoted CLP amounts are **net**. Client UI/email append `+ IVA`; do not multiply by 1.19 in formulas.

Catalog categories/items: tables `moving_categories` / `moving_catalog_items`, same admin page.

## Public → ops flow

1. User completes `/cotizar` (no volume/price on screen). Steps include **helpers** after inventory — preference only in `volumeNotes` (`Ayudantes: …`); **does not** affect price yet.
2. Server action recalculates with DB config (never trust client totals).
3. Creates `clients` + `quote_requests` (source=`website`) + `budgets` (status=**draft**) + `budget_items`
   - One **unit** line per inventory item (+ packing boxes) for ops editing, with `unitVolumeM3` stored
   - Adding / editing / removing unit lines in the admin (`src/lib/actions/budgets.ts` → `applyInventoryVolumeDelta`) moves the m³ line and price by the volume change
   - Separate **m3/fixed** charge lines for internal price estimate
4. Admin reviews/adjusts presupuesto (`budget_items` is source of truth) → mark sent / email client (**total is net**, shown as `$X + IVA`) → approve → `jobs` (`notes` empty)
   - `quote_requests.volumeNotes` is the machine-readable snapshot kept in sync via `syncBudgetItemsInNotes`; parsers and payout fallbacks read it. **Do not** copy it into `jobs.notes`
   - `budgets.notes` is the **client message** appended to the quote email. Never write generated item lines into it — the item table shows those
5. Operator sees **Tu pago** via `operatorPayoutFromClientTotal` only — never the client total
