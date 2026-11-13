import Link from "next/link";
import {
  EmptyState,
  PageHeader,
  PanelCard,
  StatusBadge,
} from "@/components/panel/ui";
import { RecordList, type RecordItem } from "@/components/panel/record-list";
import { db } from "@/db";
import { budgets, clients, quoteRequests } from "@/db/schema";
import {
  BUDGET_STATUS_LABELS,
  budgetStatusTone,
  formatClpPlusIva,
  formatDate,
  QUOTE_STATUS_LABELS,
  quoteStatusTone,
} from "@/lib/format";
import { desc, eq } from "drizzle-orm";

type SearchParams = Promise<{ filtro?: string }>;

function cleanWhatsAppPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("569") && digits.length === 11) return digits;
  if (digits.startsWith("9") && digits.length === 9) return `56${digits}`;
  if (digits.length >= 8) return digits;
  return null;
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { filtro = "todos" } = await searchParams;

  // Fetch clients joined with latest quote request and budget
  const rows = await db
    .select({
      id: clients.id,
      name: clients.name,
      phone: clients.phone,
      email: clients.email,
      notes: clients.notes,
      createdAt: clients.createdAt,
      quoteId: quoteRequests.id,
      quoteStatus: quoteRequests.status,
      quoteSource: quoteRequests.source,
      originAddress: quoteRequests.originAddress,
      destinationAddress: quoteRequests.destinationAddress,
      estimatedM3: quoteRequests.estimatedM3,
      budgetId: budgets.id,
      budgetStatus: budgets.status,
      budgetTotal: budgets.totalAmount,
    })
    .from(clients)
    .leftJoin(quoteRequests, eq(quoteRequests.clientId, clients.id))
    .leftJoin(budgets, eq(budgets.quoteRequestId, quoteRequests.id))
    .orderBy(desc(clients.createdAt));

  // Deduplicate by client id (keeping latest quote)
  const clientMap = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!clientMap.has(row.id)) {
      clientMap.set(row.id, row);
    }
  }
  const allClients = Array.from(clientMap.values());

  const totalCount = allClients.length;
  const webLeadsCount = allClients.filter(
    (c) =>
      c.quoteSource === "website" ||
      c.notes?.toLowerCase().includes("cotizador web"),
  ).length;
  const activeQuotesCount = allClients.filter((c) => Boolean(c.budgetId)).length;

  const filteredClients = allClients.filter((c) => {
    if (filtro === "web") {
      return (
        c.quoteSource === "website" ||
        c.notes?.toLowerCase().includes("cotizador web")
      );
    }
    if (filtro === "cotizaciones") {
      return Boolean(c.budgetId);
    }
    return true;
  });

  const items: RecordItem[] = filteredClients.map((row) => {
    const isWebLead =
      row.quoteSource === "website" ||
      row.notes?.toLowerCase().includes("cotizador web");

    const waPhone = cleanWhatsAppPhone(row.phone);
    const waText = encodeURIComponent(
      `Hola ${row.name}, te escribimos de Transportes EP3 respecto a tu cotización de mudanza.`,
    );

    const routeText =
      row.originAddress && row.destinationAddress
        ? `${row.originAddress} → ${row.destinationAddress}`
        : null;

    const estimateText = row.budgetTotal
      ? formatClpPlusIva(row.budgetTotal)
      : null;

    return {
      id: row.id,
      href: `/panel/clientes/${row.id}`,
      title: row.name,
      badge: (
        <div className="flex flex-wrap items-center gap-1.5">
          {isWebLead ? (
            <StatusBadge label="Lead Web" tone="accent" />
          ) : (
            <StatusBadge label="Cliente" tone="default" />
          )}
          {row.quoteStatus ? (
            <StatusBadge
              label={QUOTE_STATUS_LABELS[row.quoteStatus] ?? row.quoteStatus}
              tone={quoteStatusTone(row.quoteStatus)}
            />
          ) : null}
        </div>
      ),
      fields: [
        {
          label: "Contacto",
          value: (
            <div className="flex flex-wrap items-center gap-2">
              {row.phone ? (
                <a
                  href={`tel:${row.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-medium text-ep3-navy hover:underline"
                >
                  {row.phone}
                </a>
              ) : (
                "—"
              )}
              {waPhone ? (
                <a
                  href={`https://wa.me/${waPhone}?text=${waText}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white hover:bg-emerald-700"
                  title="Abrir chat en WhatsApp"
                >
                  💬 WhatsApp
                </a>
              ) : null}
            </div>
          ),
        },
        {
          label: "Correo",
          value: row.email ? (
            <a
              href={`mailto:${row.email}`}
              onClick={(e) => e.stopPropagation()}
              className="text-ep3-navy hover:underline"
            >
              {row.email}
            </a>
          ) : (
            "—"
          ),
        },
        {
          label: "Trayecto",
          value: routeText ? (
            <span className="line-clamp-1">{routeText}</span>
          ) : (
            <span className="text-slate-400">Sin cotización registrada</span>
          ),
        },
        {
          label: "Presupuesto",
          value: estimateText ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ep3-navy">{estimateText}</span>
              {row.estimatedM3 ? (
                <span className="text-xs text-slate-500">
                  ({row.estimatedM3} m³)
                </span>
              ) : null}
            </div>
          ) : (
            "—"
          ),
        },
        {
          label: "Fecha",
          value: formatDate(row.createdAt),
        },
      ],
      action: row.budgetId ? (
        <Link
          href={`/panel/presupuestos/${row.budgetId}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex min-h-8 items-center rounded-md border border-ep3-navy/20 bg-white px-2.5 py-1 text-xs font-semibold text-ep3-navy hover:bg-ep3-navy/5"
        >
          Ver presupuesto →
        </Link>
      ) : null,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes & Leads"
        description="Gestión integral de prospectos desde el cotizador web y contactos de mudanzas"
        actionHref="/panel/clientes/nuevo"
        actionLabel="Nuevo cliente"
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/panel/clientes?filtro=todos"
          className={`panel-card p-4 transition ${filtro === "todos" ? "ring-2 ring-ep3-navy" : "hover:border-ep3-navy/30"}`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Contactos
          </div>
          <div className="mt-1 text-2xl font-bold text-ep3-navy">{totalCount}</div>
        </Link>
        <Link
          href="/panel/clientes?filtro=web"
          className={`panel-card p-4 transition ${filtro === "web" ? "ring-2 ring-ep3-navy" : "hover:border-ep3-navy/30"}`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Leads Web (/cotizar)
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ep3-navy">{webLeadsCount}</span>
            <span className="rounded bg-ep3-yellow/30 px-1.5 py-0.5 text-xs font-bold text-ep3-navy">
              Online
            </span>
          </div>
        </Link>
        <Link
          href="/panel/clientes?filtro=cotizaciones"
          className={`panel-card p-4 transition ${filtro === "cotizaciones" ? "ring-2 ring-ep3-navy" : "hover:border-ep3-navy/30"}`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Con Presupuesto Emitido
          </div>
          <div className="mt-1 text-2xl font-bold text-ep3-navy">
            {activeQuotesCount}
          </div>
        </Link>
      </div>

      {/* Leads List */}
      <PanelCard>
        {items.length === 0 ? (
          <EmptyState message="No se encontraron contactos para este filtro." />
        ) : (
          <RecordList emptyMessage="No hay contactos registrados." items={items} />
        )}
      </PanelCard>
    </div>
  );
}
