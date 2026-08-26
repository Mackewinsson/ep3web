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
| `stripClientPriceLines(notes)` | Remove estimate/$ CLP lines from operator-facing notes |
| `syncAutoEstimateInNotes(notes, m3, opts?)` | Keep “Estimación auto” m³ + amount in sync when admin edits m³ |
| `extractAutoEstimateM3(notes)` | Parse m³ from an “Estimación auto” line |
| `DEFAULT_PRICING_CONFIG` | Fallback when DB settings missing (`operatorMarginPercent` default **20**) |

## Config (admin)

Table `quote_pricing_settings` edited at `/panel/cotizador` (admin only):

- `boxesPerM3`, `minBoxes`, `boxVolumeM3`
- `pricePerM3`, `noElevatorPerFloor`, `operatorMarginPercent` (operator sees `100 − margin`% of client budget)

Catalog categories/items: tables `moving_categories` / `moving_catalog_items`, same admin page.

## Public → ops flow

1. User completes `/cotizar` (no volume/price on screen). Steps include **helpers** after inventory — preference only in `volumeNotes` (`Ayudantes: …`); **does not** affect price yet.
2. Server action recalculates with DB config (never trust client totals).
3. Creates `clients` + `quote_requests` (source=`website`) + `budgets` (status=**draft**) + `budget_items`
   - One **unit** line per inventory item (+ packing boxes) for ops editing
   - Separate **m3/fixed** charge lines for internal price estimate
4. Admin reviews/adjusts presupuesto → mark sent / email client → approve → `jobs`
5. Operator sees **Tu pago** via `operatorPayoutFromClientTotal` only — never the client total
