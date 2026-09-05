<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Domain: quote / mudanza pricing

Volume, packing boxes, budget lines, and operator margin math live in **`src/lib/quote-pricing/`** (see `AGENTS.md` there). Do **not** reimplement formulas in UI. Admin configures values at `/panel/cotizador`.

---

## Roles & panel access

| Role (`staff_users.role`) | Login home | Panel access |
|---|---|---|
| `admin` | `/panel` | Full admin nav |
| `driver` (operador) | `/panel/mis-trabajos` | **Only** `/panel/mis-trabajos` (+ detail). Other `/panel/*` redirected (`src/proxy.ts`). |

Guards: `requireAdmin` / `requireDriver` (`src/lib/auth.ts`). Driver sessions require `driverId`.

**Domain terms**

- **Operador** — `drivers` row with `operatorId = null` (fleet owner; assignable to jobs; has panel login).
- **Conductor de flota** — `drivers.operatorId` set (crew member under an operador; chosen at accept).
- **Camión** — `trucks.operatorId` = owning operador.

Admin may hit `/panel/mis-trabajos` → redirected to `/panel/trabajos`.

---

## Public quote wizard `/cotizar`

Step order (`QuoteWizard`):

`origin` → `destination` → `inventory` → **`helpers`** → `fragile` → `parkingOrigin` → `parkingDestination` → `contact` → `thanks`

- Public UI shows **no** m³ / price.
- **Helpers** (`HelpersStep`): required preference (`driver_only` | `driver_plus_1` | `driver_plus_2` | `driver_plus_3` | `none`). Preference only — **does not** change quote price yet. Stored in `quote_requests.volumeNotes` as `Ayudantes: …` (`submit-wizard-quote`).
- Server recalculates with DB pricing (never trust client totals) → `clients` + `quote_requests` (source=`website`) + `budgets` (**draft**) + `budget_items`.

---

## Admin ops flow

1. Review presupuesto at `/panel/presupuestos` (edit lines, send, approve, reject, expire).
2. **Approve** → creates `jobs` with status `pending_assignment` (linked to budget); redirects to `/panel/trabajos/[id]`.
3. **Assign operador** (`assignJob`) → ends prior open assignment as `reassigned` if any; new open `job_assignments`; job → **`assigned`**; notifies operador.

Admin can cancel / reassign while unlocked. Locked statuses: `completed`, `cancelled`.

---

## Operator flow (`/panel/mis-trabajos`)

While `assigned` and **not** yet accepted:

1. Sees **Tu pago** = quoted price minus `operatorMarginPercent` (default **20%** app commission → operador sees **80%**). If the budget total is $0, payout is derived from *Estimación auto* / m³. Never show client total. Job detail shows each note **once** (`buildOperatorServiceNotes`); origin/dest extras sit on the map cards.
2. **Aceptar servicio** — only three fields: **nombre chofer** (fleet), **RUT chofer** (`crewDriverRut`), **patente camión** (fleet).
3. **Rechazar trabajo** — only before accept. Ends assignment `declined`; job → `pending_assignment`; notifies admins. After accept, decline is hidden/blocked (admin must cancel).

After accept (`isReadyForEnCamino`):

4. **En camino** → `in_progress` (client email simulated + admin notice).
5. **Finalizar** → `completed`.

Acceptance marker: sets `salvoConductoCompletedAt = now()`. Legacy salvoconducto columns (folio, date, communes, notes) are **nulled** on accept — do **not** rebuild that form.

Ready for En camino (`isReadyForEnCamino`): `truckId` + `crewDriverId` + `crewDriverRut` + `salvoConductoCompletedAt`.

---

## Job lifecycle

**Statuses:** `pending_assignment` → `assigned` → `in_progress` → `completed` | `cancelled`

**Assignment end reasons** (`endedAt` + `endReason`): `declined` | `reassigned` | `cancelled`

One open assignment per job (`job_assignments_one_open` unique index where `endedAt is null`).

---

## Key modules

| Module | Role |
|---|---|
| `src/lib/quote-pricing/` | Volume, boxes, budget math, operator margin |
| `src/lib/actions/submit-wizard-quote.ts` | Public wizard persist |
| `src/lib/actions/budgets.ts` | Approve → create job |
| `src/lib/actions/jobs.ts` | Assign, accept, decline, advance |
| `src/lib/job-rules.ts` | Pure status / ready-for-en-camino checks (unit-tested) |
| `src/lib/job-lifecycle.ts` | Open assignment DB helpers; re-exports job-rules |
| `src/lib/jobs-view.ts` | Operator queries, ownership, payout helpers, safe notes |
| `src/components/panel/accept-service-modal.tsx` | Accept UI (chofer / RUT / patente) |
| `src/components/panel/quote-volume-sync-fields.tsx` | Admin cotización: sync m³ ↔ Estimación auto notes |
| `src/db/schema.ts` | Tables; `crewDriverRut`; acceptance timestamp on assignment |

**Tests:** `npm run test:unit` (pricing + job rules). E2E: `npm run test:e2e`.

---

## Agents must NOT

- Show **client price / budget total** to operators (payout + stripped notes only).
- Duplicate volume / box / price formulas outside `src/lib/quote-pricing/`.
- Treat accept as a full salvoconducto form (folio, comunas, etc.) — only chofer + RUT + patente.
- Invent alternate decline rules (decline only before accept).
- Give drivers access to admin panel routes.
