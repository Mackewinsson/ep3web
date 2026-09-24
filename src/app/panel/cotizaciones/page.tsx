import Link from "next/link";
import {
  EmptyState,
  PageHeader,
  PanelCard,
  StatusBadge,
} from "@/components/panel/ui";
import { RecordList, type RecordItem } from "@/components/panel/record-list";
import { db } from "@/db";
import { budgets, clients, quoteRequests, servicePackages } from "@/db/schema";
import {
  BUDGET_STATUS_LABELS,
  budgetStatusTone,
  formatClpPlusIva,
  QUOTE_STATUS_LABELS,
  quoteStatusTone,
} from "@/lib/format";
import { asc, desc, eq } from "drizzle-orm";

function loadQuoteRows() {
  return db
    .select({
      id: quoteRequests.id,
      originAddress: quoteRequests.originAddress,
      destinationAddress: quoteRequests.destinationAddress,
      status: quoteRequests.status,
      source: quoteRequests.source,
      estimatedM3: quoteRequests.estimatedM3,
      estimatedItems: quoteRequests.estimatedItems,
      clientName: clients.name,
      packageName: servicePackages.name,
      budgetId: budgets.id,
      budgetStatus: budgets.status,
      budgetTotal: budgets.totalAmount,
    })
    .from(quoteRequests)
    .innerJoin(clients, eq(quoteRequests.clientId, clients.id))
    .leftJoin(servicePackages, eq(quoteRequests.packageId, servicePackages.id))
    .leftJoin(budgets, eq(budgets.quoteRequestId, quoteRequests.id))
    .orderBy(desc(quoteRequests.createdAt), asc(budgets.createdAt));
}

type Row = Awaited<ReturnType<typeof loadQuoteRows>>[number];

function volumeLabel(row: Row) {
  const parts = [
    row.estimatedM3 ? `${row.estimatedM3} m³` : null,
    row.estimatedItems ? `${row.estimatedItems} ítems` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function route(row: Row) {
  return (
    <span className="line-clamp-2">
      {row.originAddress} → {row.destinationAddress}
    </span>
  );
}

function sourceLabel(row: Row) {
  return row.source === "website" ? "Sitio web" : "Panel";
}

/** Leads still without a price: the quote itself is where the work happens. */
function pendingItem(row: Row): RecordItem {
  return {
    id: row.id,
    href: `/panel/cotizaciones/${row.id}`,
    title: row.clientName,
    badge: (
      <StatusBadge
        label={QUOTE_STATUS_LABELS[row.status] ?? row.status}
        tone={quoteStatusTone(row.status)}
      />
    ),
    fields: [
      { label: "Paquete", value: row.packageName ?? "A medida" },
      { label: "Ruta", value: route(row) },
      { label: "Volumen", value: volumeLabel(row) },
      { label: "Origen", value: sourceLabel(row) },
    ],
  };
}

/** Already priced: the budget is the live document, so open that one. */
function quotedItem(row: Row): RecordItem {
  const status = row.budgetStatus ?? "draft";
  return {
    id: row.id,
    href: `/panel/presupuestos/${row.budgetId}`,
    title: row.clientName,
    badge: (
      <StatusBadge
        label={BUDGET_STATUS_LABELS[status] ?? status}
        tone={budgetStatusTone(status)}
      />
    ),
    fields: [
      {
        label: "Total",
        value: row.budgetTotal ? formatClpPlusIva(row.budgetTotal) : "—",
      },
      { label: "Ruta", value: route(row) },
      { label: "Volumen", value: volumeLabel(row) },
      { label: "Origen", value: sourceLabel(row) },
    ],
    action: (
      <Link
        href={`/panel/cotizaciones/${row.id}`}
        aria-label={`Ver cotización de ${row.clientName}`}
        className="text-sm font-medium text-ep3-navy underline"
      >
        Ver cotización
      </Link>
    ),
  };
}

export default async function CotizacionesPage() {
  const joined = await loadQuoteRows();

  // A quote can carry several budgets (versions or options); the oldest one is
  // the entry point, and the join above already sorts them.
  const rows = new Map<string, Row>();
  for (const row of joined) {
    if (!rows.has(row.id)) rows.set(row.id, row);
  }

  const all = [...rows.values()];
  const pending = all.filter((row) => !row.budgetId);
  const quoted = all.filter((row) => row.budgetId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cotizaciones"
        description="Solicitudes de presupuesto (sitio web y panel)"
        actionHref="/panel/cotizaciones/nueva"
        actionLabel="Nueva cotización"
      />

      <PanelCard>
        <div className="mb-4">
          <h2 className="font-semibold text-ep3-navy">Por cotizar</h2>
          <p className="text-sm text-ep3-navy/60">
            Solicitudes que todavía no tienen presupuesto.
          </p>
        </div>
        {pending.length === 0 ? (
          <EmptyState message="No hay solicitudes pendientes de cotizar." />
        ) : (
          <RecordList
            emptyMessage="No hay solicitudes pendientes de cotizar."
            items={pending.map(pendingItem)}
          />
        )}
      </PanelCard>

      {quoted.length > 0 ? (
        <PanelCard>
          <div className="mb-4">
            <h2 className="font-semibold text-ep3-navy">Ya cotizadas</h2>
            <p className="text-sm text-ep3-navy/60">
              Abren el presupuesto, que es el documento vivo.
            </p>
          </div>
          <RecordList
            emptyMessage="Sin cotizaciones con presupuesto."
            items={quoted.map(quotedItem)}
          />
        </PanelCard>
      ) : null}
    </div>
  );
}
