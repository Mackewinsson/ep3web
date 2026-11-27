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

## End-to-end lifecycle (DB + panel + emails) — DO NOT SKIP

This flow is **already implemented**. Agents must preserve every step, every panel bell notice, and every email below. Do not invent alternate triggers, drop a mail, or show prices in the wrong audience.

Transport: `deliverEmail` (`src/lib/email/deliver.ts`) via Resend when `RESEND_API_KEY` is set; otherwise logs a mock and continues. Client-facing mails use branded responsive HTML. Sender default: `Transportes EP3 <cotizaciones@transportesep3.cl>` (`EMAIL_FROM` override). Admin ops inbox for new web quotes: `ADMIN_NOTIFICATION_EMAIL` (fallback `transportesep3@gmail.com`) — **not** the same as `ADMIN_EMAIL` (panel staff login).

| # | Trigger | Persist / status | Panel bell (`notifyAdmins` / `notifyDriver`) | Email |
|---|---|---|---|---|
| 1 | Cliente termina wizard `/cotizar` | `clients` + `quote_requests` (`source=website`, `status=new`) + `budgets` (**draft**) + `budget_items`. Server recalculates pricing (never trust client totals). | Admins: `new_quote` → `/panel/presupuestos/{id}` | **Cliente:** ack branded «Cotización recibida» — **sin precio, totales ni ítems** (`notifyNewQuoteSubmitted` → `src/lib/email/new-quote.ts`). **Admin inbox:** ops notice with cliente, trayecto, m³, estimación `$X + IVA`, fecha (`getAdminNotificationEmail`). |
| 2 | Admin marca presupuesto `sent` | `budgets.status = sent` only | — | **Ninguno.** Marcar «enviado» **no** manda la cotización con precio. |
| 3 | Admin **aprueba** presupuesto (`setBudgetStatus` → `approved`) | Budget → `approved`. Creates `jobs` (`pending_assignment`, `notes: null`) if none exists. Redirect `/panel/trabajos/{id}`. | Admins: `quote_email` delivery notice (`sent` / `mocked` / `skipped` / `failed`). Admins: `new_job` (“Nuevo trabajo sin conductor”). | **Cliente:** cotización formal con total `$X + IVA` + mensaje admin en `budgets.notes` (`notifyClientQuote` → `src/lib/email/client-quote.ts`). Solo al **primer** paso a `approved` (`shouldEmailQuoteToClient`). Falta de correo o error Resend **no** bloquea la creación del trabajo. |
| 3b | Admin **Reenviar al cliente** (`sendBudgetToClient`) | Only if budget already `approved` | Same `quote_email` delivery notice | Re-envía la cotización con precio. |
| 4 | Admin **asigna operador** (`assignJob`) | Ends prior open assignment as `reassigned` if any; new open `job_assignments`; job → **`assigned`**. | Operador: `job_assigned`. Prev operador (si cambia): `job_unassigned`. Si operador sin usuario panel: admins `driver_no_app_access`. Admins: `assignment_email` delivery notice. | **Operador:** `sendDriverAssignmentEmail` (`src/lib/email/resend.ts`) — cliente, origen/destino, fecha/hora, notas **sin total cliente**. `emailSentAt` solo si Resend acepta (mock no cuenta). |
| 5 | Operador **rechaza** (solo antes de aceptar) | Assignment `declined`; job → `pending_assignment` | Admins: `job_declined` | Ninguno al cliente. |
| 6 | Operador **acepta servicio** (chofer + RUT + patente) | Job stays `assigned`. Sets `crewDriverId`, `crewDriverRut`, `truckId`, `salvoConductoCompletedAt=now()`; legacy salvoconducto cols nulled. Badge **Aceptado** = `isReadyForEnCamino`. | Admins: `job_accepted` (“Servicio aceptado”). Admins: `client_job_accepted_email` delivery notice. | **Cliente:** confirmación branded con chofer, RUT, patente, fecha/hora, trayecto (`notifyClientJobAccepted` → `src/lib/email/client-job-accepted.ts`). Subject: «¡Mudanza confirmada! Chofer y camión asignados». Admin puede **reenviar** (`resendClientJobAcceptedEmail`). |
| 7 | Operador (o admin) marca **En camino** | Job → `in_progress` (requires `isReadyForEnCamino`) | Admins: `client_en_camino_email` delivery notice | **Cliente:** «Tu mudanza va en camino — Transportes EP3» con origen, destino, chofer, RUT, patente (`notifyClientEnCamino` → `src/lib/email/client-en-camino.ts`). Admin puede **Reenviar aviso al cliente** (`resendClientEnCaminoEmail`) si el trabajo está `in_progress` o `completed`. |
| 8 | Operador **finaliza** | Job → `completed` | Admins: `job_completed` | Ninguno al cliente. |
| — | Admin cancela / reasigna / edita fecha·hora·notas | Cancel → `cancelled` (+ end assignment `cancelled`). Edit assigned job notifies operador. | Operador: `job_cancelled` / `job_updated`. Reassign covered in step 4. | Sin correo al cliente en cancel/update. |
| — | Admin **Seguimiento** manual desde `/panel/clientes/[id]` | — | Admins: `client_follow_up_email` delivery notice | Cliente: follow-up opcional (`sendFollowUpEmail` → `src/lib/email/follow-up.ts`). **No** es automático del flujo principal. |

**Audience rules (hard):**

- Cliente never sees operator payout / margin.
- Operador never sees client budget total (payout + stripped notes only).
- Operador never sees client phone until accept (`isReadyForEnCamino`).
- Assignment email to operador omits client total.
- New-quote client ack has **no** price; priced quote only on **approve** (or resend after approve).

Panel bell polls (~3s) and `router.refresh()` when unread increases so status updates without a full reload.

---

## Public quote wizard `/cotizar`

Step order (`QuoteWizard`):

`origin` → `destination` → `inventory` → **`helpers`** → `fragile` → `parkingOrigin` → `parkingDestination` → `contact` → `thanks`

- Public UI shows **no** m³ / price.
- **Helpers** (`HelpersStep`): required preference (`driver_only` | `driver_plus_1` | `driver_plus_2` | `driver_plus_3` | `none`). Preference only — **does not** change quote price yet. Stored in `quote_requests.volumeNotes` as `Ayudantes: …` (`submit-wizard-quote`).
- **Preferred date & time**: `data.contact.preferredDate` is saved into `quote_requests.preferredDate` AND formatted into `quote_requests.volumeNotes` as `Fecha preferida: …` right before `Hora preferida`.
- On submit → see lifecycle step 1 (persist + panel `new_quote` + client ack email + admin ops email).

---

## Admin ops flow

1. Review presupuesto at `/panel/presupuestos` (edit lines, mark `sent`, approve, reject, expire). Client-facing totals use `formatClpPlusIva` (`$X + IVA`); stored amount stays net — do **not** bake IVA into pricing formulas. Adding/editing budget lines updates `quote_requests.volumeNotes` from `budget_items` **merged with the client Inventario still in notes** (`syncBudgetItemsInNotes`). Missing client items are inserted as unit rows. Volume details live in `volumeNotes` — **Notas del trabajo** (`jobs.notes`) stays empty so admin can write operational notes. `budgets.notes` is the **message emailed to the client** (not the Inventario dump). «Detalles del servicio» shows client answers including **Fecha preferida** (`quote_requests.preferredDate` fallback for legacy).
2. **Approve** → lifecycle step 3 (priced client email + job `pending_assignment`). **Reenviar al cliente** → step 3b. Marking `sent` alone does **not** email the priced quote.
3. **Assign operador** → lifecycle step 4.
4. After operator accept / en camino → badges via `adminJobBadge` + `isReadyForEnCamino` (**Por aceptar** vs **Aceptado**). Resend client accept / en-camino notices from trabajo detail when needed.

Admin can cancel / reassign while unlocked. Changing fecha/hora/notas on an assigned job notifies the operador (`job_updated`). Locked statuses: `completed`, `cancelled`.

---

## Operator flow (`/panel/mis-trabajos`)

While `assigned` and **not** yet accepted:

1. Sees **Tu pago** = quoted price minus `operatorMarginPercent` (default **20%** app commission → operador sees **80%**). If the budget total is $0, payout is derived from *Estimación auto* / m³. Never show client total. Notes via `operatorSafeNotes` / `stripClientPriceLines`.
2. **Client phone is HIDDEN before accept**: no phone / `Llamar` until `isReadyForEnCamino`. UI notice: *El teléfono del cliente estará disponible al aceptar el servicio*.
3. **Aceptar servicio** — only three fields: **nombre chofer** (fleet), **RUT chofer** (`crewDriverRut`), **patente camión** (fleet). Triggers lifecycle step 6 (client confirmation email + admin bells). List/detail badges: **Por aceptar** vs **Por iniciar** via `driverJobBadge`.
4. **Rechazar trabajo** — only before accept (lifecycle step 5). After accept, decline is hidden/blocked (admin must cancel).

After accept (`isReadyForEnCamino`):

5. **Client phone revealed**: `Llamar {job.clientPhone}` active.
6. **En camino** → lifecycle step 7.
7. **Finalizar** → lifecycle step 8.

Acceptance marker: `salvoConductoCompletedAt = now()`. Legacy salvoconducto columns (folio, date, communes, notes) are **nulled** on accept — do **not** rebuild that form.

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
| `src/lib/actions/submit-wizard-quote.ts` | Public wizard persist + triggers new-quote emails |
| `src/lib/actions/budgets.ts` | Approve → create job + priced client email; resend quote; item sync → notes |
| `src/lib/actions/jobs.ts` | Assign, accept, decline, advance; client accept / en-camino emails + resends |
| `src/lib/email/deliver.ts` | Shared Resend sender (mock when `RESEND_API_KEY` unset) + admin delivery-notice titles |
| `src/lib/email/new-quote.ts` | Client ack (no price) + admin ops inbox on wizard submit |
| `src/lib/email/client-quote.ts` | Priced quote on approve / resend |
| `src/lib/email/resend.ts` | Operator assignment email (no client total) |
| `src/lib/email/client-job-accepted.ts` | Client confirmation on operator accept (chofer / RUT / patente) |
| `src/lib/email/client-en-camino.ts` | Client “en camino” notice |
| `src/lib/email/follow-up.ts` | Manual client follow-up from clientes panel |
| `src/lib/notifications.ts` | Panel bell: `notifyAdmins` / `notifyDriver` |
| `src/lib/budget-notes.ts` | Push budget lines into `quote_requests.volumeNotes`; clear volume copies from `jobs.notes` |
| `src/lib/job-notes.ts` | Hide job notes that duplicate volume (`operationalJobNotes`) |
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

**Tests:** `npm run test:unit` (pricing + job rules + job notes vs volume + admin badges + quote IVA + email builders). E2E: `npm run test:e2e` (quote → presupuesto → trabajo → operador → En camino, plus decline/cancel). Both run in `.github/workflows/ci.yml`. Bootstrap an empty Postgres with `npm run db:prepare`.

---

## Agents must NOT

- Skip, reorder, or invent alternate triggers for the **End-to-end lifecycle** emails / panel notices above.
- Email the **priced** quote on wizard submit or on marking presupuesto `sent` — only on **approve** (or resend after approve). The submit ack has **no** price.
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
