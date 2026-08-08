import {
  EmptyState,
  PageHeader,
  PanelCard,
  StatusBadge,
} from "@/components/panel/ui";
import { RecordList } from "@/components/panel/record-list";
import { db } from "@/db";
import { clients, quoteRequests, servicePackages } from "@/db/schema";
import { QUOTE_STATUS_LABELS } from "@/lib/format";
import { desc, eq } from "drizzle-orm";

export default async function CotizacionesPage() {
  const rows = await db
    .select({
      id: quoteRequests.id,
      originAddress: quoteRequests.originAddress,
      destinationAddress: quoteRequests.destinationAddress,
      preferredDate: quoteRequests.preferredDate,
      status: quoteRequests.status,
      source: quoteRequests.source,
      estimatedM3: quoteRequests.estimatedM3,
      estimatedItems: quoteRequests.estimatedItems,
      clientName: clients.name,
      packageName: servicePackages.name,
    })
    .from(quoteRequests)
    .innerJoin(clients, eq(quoteRequests.clientId, clients.id))
    .leftJoin(
      servicePackages,
      eq(quoteRequests.packageId, servicePackages.id),
    )
    .orderBy(desc(quoteRequests.createdAt));

  const volume = (row: (typeof rows)[number]) => {
    const parts = [
      row.estimatedM3 ? `${row.estimatedM3} m³` : null,
      row.estimatedItems ? `${row.estimatedItems} ítems` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : "—";
  };

  return (
    <div>
      <PageHeader
        title="Cotizaciones"
        description="Solicitudes de presupuesto (web y panel)"
        actionHref="/panel/cotizaciones/nueva"
        actionLabel="Nueva cotización"
      />
      <PanelCard>
        {rows.length === 0 ? (
          <EmptyState message="No hay cotizaciones todavía." />
        ) : (
          <RecordList
            emptyMessage="No hay cotizaciones todavía."
            items={rows.map((row) => ({
              id: row.id,
              href: `/panel/cotizaciones/${row.id}`,
              title: row.clientName,
              badge: (
                <StatusBadge
                  label={QUOTE_STATUS_LABELS[row.status] ?? row.status}
                />
              ),
              fields: [
                { label: "Paquete", value: row.packageName ?? "A medida" },
                {
                  label: "Ruta",
                  value: (
                    <span className="line-clamp-2">
                      {row.originAddress} → {row.destinationAddress}
                    </span>
                  ),
                },
                { label: "Volumen", value: volume(row) },
                {
                  label: "Origen",
                  value: row.source === "website" ? "Web" : "Panel",
                },
              ],
            }))}
          />
        )}
      </PanelCard>
    </div>
  );
}
