import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BudgetItemsGrid } from "@/components/panel/budget-items-grid";
import { QuoteItemsGrid } from "@/components/panel/quote-items-grid";
import { QuoteVolumeSyncFields } from "@/components/panel/quote-volume-sync-fields";
import { ServiceDetailsCard } from "@/components/panel/service-details-card";
import {
  BackLink,
  Field,
  PageHeader,
  PanelCard,
  SelectField,
  StatusBadge,
  SubmitButton,
  TextArea,
} from "@/components/panel/ui";
import { db } from "@/db";
import { budgets, clients, quoteRequests, servicePackages } from "@/db/schema";
import {
  convertQuoteToBudget,
  setQuoteStatus,
  updateQuoteRequest,
} from "@/lib/actions/quotes";
import { loadBudgetItemsView } from "@/lib/budget-items-view";
import { QUOTE_STATUS_LABELS, quoteStatusTone } from "@/lib/format";
import { getPricingConfig } from "@/lib/moving-catalog-db";
import { getQuoteItemsView } from "@/lib/quote-items";

type Props = { params: Promise<{ id: string }> };

const inputClassName =
  "w-full rounded-md border border-ep3-navy/20 bg-white px-3 py-2.5 text-base text-ep3-navy outline-none focus:border-ep3-navy md:text-sm";

const actionButton =
  "inline-flex min-h-11 w-full items-center justify-center rounded-md px-3 py-2 text-sm sm:w-auto";

function OpenBudgetLink({ budgetId }: { budgetId: string }) {
  return (
    <Link
      href={`/panel/presupuestos/${budgetId}`}
      className="inline-flex min-h-9 items-center justify-center rounded-md bg-ep3-navy px-3 text-xs font-semibold text-white hover:bg-ep3-navy/90"
    >
      Abrir presupuesto
    </Link>
  );
}

function loadQuote(id: string) {
  return db
    .select()
    .from(quoteRequests)
    .where(eq(quoteRequests.id, id))
    .limit(1);
}

export default async function CotizacionDetailPage({ params }: Props) {
  const { id } = await params;

  const [loaded] = await loadQuote(id);

  if (!loaded) notFound();

  const [clientRows, packageRows, linkedBudgets, pricing] = await Promise.all([
    db
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .orderBy(asc(clients.name)),
    db
      .select({ id: servicePackages.id, name: servicePackages.name })
      .from(servicePackages)
      .where(eq(servicePackages.active, true))
      .orderBy(asc(servicePackages.sortOrder)),
    db
      .select({
        id: budgets.id,
        title: budgets.title,
        status: budgets.status,
        totalAmount: budgets.totalAmount,
      })
      .from(budgets)
      .where(eq(budgets.quoteRequestId, id))
      .orderBy(asc(budgets.createdAt)),
    getPricingConfig(),
  ]);

  const primaryBudget = linkedBudgets[0] ?? null;
  // Items are editable here while the offer is still open, so the admin never
  // has to jump to the budget screen to fix the inventory.
  const editableBudget =
    primaryBudget &&
    (primaryBudget.status === "draft" || primaryBudget.status === "sent")
      ? primaryBudget
      : null;

  const budgetItemsView = editableBudget
    ? await loadBudgetItemsView(editableBudget.id)
    : null;

  // Hydrating a legacy budget rewrites the volume snapshot on the quote.
  const [refreshed] = budgetItemsView?.hydrated ? await loadQuote(id) : [null];
  const quote = refreshed ?? loaded;

  const readOnlyItems = budgetItemsView
    ? null
    : await getQuoteItemsView({
        budgetId: primaryBudget?.id ?? null,
        volumeNotes: quote.volumeNotes,
        estimatedM3: quote.estimatedM3,
      });

  const open = quote.status !== "converted" && quote.status !== "closed";

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/panel/cotizaciones" label="Volver a cotizaciones" />
        <PageHeader
          title="Detalle de cotización"
          description={`Origen: ${quote.source === "website" ? "Sitio web" : "Panel"}`}
        />
      </div>

      <PanelCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge
              label={QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
              tone={quoteStatusTone(quote.status)}
            />
            {linkedBudgets.length > 0 ? (
              <span className="text-sm text-ep3-navy/60">
                Presupuesto:{" "}
                {linkedBudgets.map((b, i) => (
                  <span key={b.id}>
                    {i > 0 ? ", " : ""}
                    <Link
                      href={`/panel/presupuestos/${b.id}`}
                      className="font-medium text-ep3-navy underline"
                    >
                      {b.title}
                    </Link>
                  </span>
                ))}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {open ? (
              <>
                {quote.status === "new" ? (
                  <form action={setQuoteStatus.bind(null, id, "in_progress")}>
                    <button
                      type="submit"
                      className={`${actionButton} bg-ep3-navy text-white`}
                    >
                      Marcar en gestión
                    </button>
                  </form>
                ) : null}
                <form action={setQuoteStatus.bind(null, id, "closed")}>
                  <button
                    type="submit"
                    className={`${actionButton} border border-ep3-navy/20 text-ep3-navy`}
                  >
                    Cerrar
                  </button>
                </form>
                {primaryBudget ? null : (
                  <form action={convertQuoteToBudget.bind(null, id)}>
                    <button
                      type="submit"
                      className={`${actionButton} bg-ep3-yellow font-semibold text-ep3-navy`}
                    >
                      Crear presupuesto
                    </button>
                  </form>
                )}
              </>
            ) : null}
            {quote.status === "closed" ? (
              <form action={setQuoteStatus.bind(null, id, "in_progress")}>
                <button
                  type="submit"
                  className={`${actionButton} border border-ep3-navy/20 text-ep3-navy`}
                >
                  Reabrir
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </PanelCard>

      {budgetItemsView && editableBudget ? (
        <BudgetItemsGrid
          budgetId={editableBudget.id}
          items={budgetItemsView.rows}
          totalAmount={editableBudget.totalAmount}
          billedM3={budgetItemsView.billedM3}
          returnTo={`/panel/cotizaciones/${id}`}
          actions={<OpenBudgetLink budgetId={editableBudget.id} />}
        />
      ) : readOnlyItems ? (
        <QuoteItemsGrid
          breakdown={readOnlyItems.breakdown}
          source={readOnlyItems.source}
          actions={
            primaryBudget ? (
              <OpenBudgetLink budgetId={primaryBudget.id} />
            ) : null
          }
        />
      ) : null}

      <ServiceDetailsCard notes={quote.volumeNotes} />

      <form
        // Volume and notes are rewritten server-side from the linked budget;
        // remount so the uncontrolled fields pick up the new values.
        key={`${quote.estimatedM3 ?? ""}|${quote.estimatedItems ?? ""}|${quote.volumeNotes ?? ""}`}
        action={updateQuoteRequest.bind(null, id)}
        className="space-y-4"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <PanelCard>
            <h2 className="mb-3 font-semibold text-ep3-navy">
              Datos de la cotización
            </h2>
            <div className="space-y-4">
              <SelectField
                label="Cliente"
                name="clientId"
                required
                defaultValue={quote.clientId}
                options={clientRows.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              />
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ep3-navy">
                  Paquete (opcional)
                </span>
                <select
                  name="packageId"
                  defaultValue={quote.packageId ?? ""}
                  className={inputClassName}
                >
                  <option value="">Sin paquete / a medida</option>
                  {packageRows.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <TextArea
                label="Dirección origen"
                name="originAddress"
                required
                defaultValue={quote.originAddress}
              />
              <TextArea
                label="Dirección destino"
                name="destinationAddress"
                required
                defaultValue={quote.destinationAddress}
              />
              <Field
                label="Fecha preferida"
                name="preferredDate"
                type="date"
                defaultValue={quote.preferredDate ?? undefined}
              />
            </div>
          </PanelCard>

          <PanelCard>
            <h2 className="mb-1 font-semibold text-ep3-navy">Volumen</h2>
            <p className="mb-3 text-sm text-ep3-navy/60">
              Los m³ y la estimación se mantienen sincronizados con el texto
              del cotizador.
            </p>
            <div className="space-y-4">
              <QuoteVolumeSyncFields
                initialM3={quote.estimatedM3}
                initialItems={quote.estimatedItems}
                initialNotes={quote.volumeNotes}
                pricePerM3={pricing.pricePerM3}
                notesSummary="Ver texto del cotizador"
              />
            </div>
          </PanelCard>
        </div>

        <SubmitButton label="Guardar cambios" />
      </form>
    </div>
  );
}
