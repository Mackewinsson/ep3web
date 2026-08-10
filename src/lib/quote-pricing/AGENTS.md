# Quote pricing (agents)

**Single source of truth:** [`src/lib/quote-pricing/calculate.ts`](calculate.ts)

Do **not** duplicate box/volume/price formulas in React components. Import from this module.

## Functions

| Function | Purpose |
|---|---|
| `sumInventory(quantities, items)` | Furniture m³ + lines from catalog quantities |
| `suggestBoxes(furnitureM3, config)` | Packing box count |
| `buildQuoteEstimate({...})` | Totals + budget line drafts (CLP) |
| `DEFAULT_PRICING_CONFIG` | Fallback when DB settings missing |

## Config (admin)

Table `quote_pricing_settings` edited at `/panel/cotizador` (admin only):

- `boxesPerM3`, `minBoxes`, `boxVolumeM3`
- `pricePerM3`, `noElevatorPerFloor`

Catalog categories/items: tables `moving_categories` / `moving_catalog_items`, same admin page.

## Public → ops flow

1. User completes `/cotizar` (public UI shows **no** volume/price; last screen is thank-you + email notice)
2. Server action recalculates with DB config (never trust client totals)
3. Creates `clients` + `quote_requests` (source=website) + `budgets` (status=**draft**) + `budget_items`
   - One **unit** line per inventory item (+ packing boxes) for ops editing
   - Separate **m3/fixed** charge lines for internal price estimate
4. Admin reviews/adjusts presupuesto cards in panel → mark sent / email client → approve → `jobs`
