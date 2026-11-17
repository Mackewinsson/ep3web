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
- **Preferred date & time**: `data.contact.preferredDate` is saved into `quote_requests.preferredDate` AND formatted into `quote_requests.volumeNotes` as `Fecha preferida: …` right before `Hora preferida`.
- Server recalculates with DB pricing (never trust client totals) → `clients` + `quote_requests` (source=`website`) + `budgets` (**draft**) + `budget_items`.

---

## Admin ops flow

1. Review presupuesto at `/panel/presupuestos` (edit lines, approve, reject, expire). Client-facing totals use `formatClpPlusIva` (`$X + IVA`); the stored amount stays net — do **not** bake IVA into pricing formulas. A website quote emails the admin at `transportesep3@gmail.com` (`ADMIN_NOTIFICATION_EMAIL`, fallback `transportesep3@gmail.com` — `ADMIN_EMAIL` is panel staff login only) (`notifyNewQuoteSubmitted`) and emails the client an acknowledgment titled **Cotización recibida** with no price, totals, or item details. The priced quote (`$X + IVA`) is emailed only when the presupuesto is **approved** (`notifyClientQuote`). **Reenviar al cliente** retries that approved quote. Adding/editing budget lines updates **Notas** and `quote_requests.volumeNotes` from `budget_items` **merged with the client Inventario still in notes** (`syncBudgetItemsInNotes`). Missing client items are inserted as unit rows. Volume details live there — **Notas del trabajo** (`jobs.notes`) stays empty so admin can write operational notes. «Detalles del servicio» displays the client's answers including **Fecha preferida** (using `quote_requests.preferredDate` as fallback for legacy records).
2. **Approve** → emails the client the total with `+ IVA`, then creates `jobs` with status `pending_assignment` (linked to budget) and `notes: null`; redirects to `/panel/trabajos/[id]`. A missing address or a Resend error does not block the job; admins get a notice and can resend.
3. **Assign operador** (`assignJob`) → ends prior open assignment as `reassigned` if any; new open `job_assignments`; job → **`assigned`**; notifies operador in the panel and by email (`sendDriverAssignmentEmail`). The operator email omits the client total. `emailSentAt` is set only when Resend accepts the message. Admins get a notice for sent, simulated, missing address, or failure.
4. Operator **Aceptar servicio** — job stays `assigned` (no new status enum). Admin list/detail/dashboard show **Por aceptar** vs **Aceptado** via `adminJobBadge` + `isReadyForEnCamino`. Operator list/detail show **Por aceptar** vs **Por iniciar** via `driverJobBadge`. `notifyAdmins` type `job_accepted` (“Servicio aceptado”). The panel bell polls (~3s) and `router.refresh()` when unread increases so status updates without a full reload.

Admin can cancel / reassign while unlocked. Changing fecha/hora/notas on an assigned job notifies the operador (`job_updated`). Locked statuses: `completed`, `cancelled`. When a job is in camino, admin has **Reenviar aviso al cliente** if the client did not receive the initial notice.

---

## Operator flow (`/panel/mis-trabajos`)

While `assigned` and **not** yet accepted:

1. Sees **Tu pago** = quoted price minus `operatorMarginPercent` (default **20%** app commission → operador sees **80%**). If the budget total is $0, payout is derived from *Estimación auto* / m³. Never show client total. Notes via `operatorSafeNotes` / `stripClientPriceLines`.
2. **Client phone is HIDDEN before accept**: The operator MUST NOT see the client phone number or the `Llamar` button before accepting (`isReadyForEnCamino` = false). The UI shows a notice (*El teléfono del cliente estará disponible al aceptar el servicio*). This prevents operators from calling the client outside the platform to undercut EP3 before confirming the job.
3. **Aceptar servicio** — only three fields: **nombre chofer** (fleet), **RUT chofer** (`crewDriverRut`), **patente camión** (fleet). Notifies admins (`job_accepted`).
4. **Rechazar trabajo** — only before accept. Ends assignment `declined`; job → `pending_assignment`; notifies admins. After accept, decline is hidden/blocked (admin must cancel).

After accept (`isReadyForEnCamino`):

5. **Client phone revealed**: The `Llamar {job.clientPhone}` button becomes active.
6. **En camino** → `in_progress`. Client gets a branded responsive HTML email ("Tu mudanza va en camino — Transportes EP3") with origin, destination, driver, and truck plate. UI verifies actual send status from notifications. Admins are notified (`client_en_camino_email`).
7. **Finalizar** → `completed`.

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
| `src/lib/actions/budgets.ts` | Approve → create job; send/resend client quote; item add/edit/delete syncs notes from `budget_items` |
| `src/lib/email/deliver.ts` | Shared Resend sender (mock when `RESEND_API_KEY` is unset) |
| `src/lib/budget-notes.ts` | Push budget lines into budget notes + `quote_requests.volumeNotes`; clear volume copies from `jobs.notes` |
| `src/lib/job-notes.ts` | Hide job notes that duplicate volume (`operationalJobNotes`) |
| `src/lib/actions/jobs.ts` | Assign, accept, decline, advance |
| `src/lib/job-rules.ts` | Pure status / ready-for-en-camino checks (unit-tested) |
| `src/lib/job-lifecycle.ts` | Open assignment DB helpers; re-exports job-rules |
| `src/lib/jobs-view.ts` | Operator queries, ownership, payout helpers, safe notes; `getOpenAssignmentSummaries` for admin accepted badges |
| `src/lib/format.ts` | Labels + `adminJobBadge` / `driverJobBadge` + `formatClpPlusIva` + `trimDecimals` + `formatDate` |
| `src/lib/quote-items.ts` | Resolve a cotización's item breakdown from its budget, else from notes |
| `src/lib/quote-pricing/notes-sections.ts` | Split notes into client wizard answers vs the admin's message; parses `Fecha preferida` / `Fecha solicitada` |
| `src/components/panel/accept-service-modal.tsx` | Accept UI (chofer / RUT / patente) |
| `src/components/panel/data-grid.tsx` | Shared spreadsheet primitives (card, stat strip, cell/button tokens) |
| `src/components/panel/budget-items-grid.tsx` | Presupuesto: editable full-width item table (inline rows + add row) |
| `src/components/panel/quote-items-grid.tsx` | Read-only full-width item table (cotización, trabajo admin, mis-trabajos). No prices |
| `src/components/panel/service-details-card.tsx` | Read-only «Detalles del servicio» (fecha preferida, acceso, ayudantes, delicados, hora) |
| `src/components/panel/quote-volume-sync-fields.tsx` | Admin cotización: sync m³ ↔ Estimación auto notes |
| `src/db/schema.ts` | Tables; `crewDriverRut`; acceptance timestamp on assignment |

**Tests:** `npm run test:unit` (pricing + job rules + job notes vs volume + admin badges + quote IVA). E2E: `npm run test:e2e` (quote → presupuesto → trabajo → operador → En camino, plus decline/cancel). Both run in `.github/workflows/ci.yml`. Bootstrap an empty Postgres with `npm run db:prepare`.

---

## Agents must NOT

- Show **client price / budget total** to operators (payout + stripped notes only).
- Show **client phone number** to operators before service acceptance (`!isReadyForEnCamino`) — reveal only after accept with crew driver, RUT, and truck.
- Omit **Fecha preferida** from `volumeNotes` or `ServiceDetailsCard` — admins must always see the requested moving date.
- Send **unformatted plain-text emails** for client notifications — must use branded responsive HTML templates to ensure deliverability and avoid spam filters.
- Write generated item lines (`Inventario:` / `Cajas:` / `Cargos:` / `Estimación auto:`) into `budgets.notes` — that field is the **message emailed to the client**. The machine-readable snapshot lives in `quote_requests.volumeNotes`.
- Duplicate volume / box / price formulas outside `src/lib/quote-pricing/`.
- Keep a second inventory list in notes that can drift from `budget_items` — notes Inventario/Cargos come from the budget lines, **merged** with the client wizard list still in notes so adding a manual line cannot wipe what the client chose.
- Copy volume/inventory into **Notas del trabajo** — that field is operational only; volume stays in `quote_requests.volumeNotes`.
- Bake IVA into stored quote/budget totals — show `+ IVA` next to the net amount.
- Treat accept as a full salvoconducto form (folio, comunas, etc.) — only chofer + RUT + patente.
- Invent alternate decline rules (decline only before accept).
- Invent a new `jobs.status` for accept — derive **Aceptado** from `isReadyForEnCamino`.
- Give drivers access to admin panel routes.
