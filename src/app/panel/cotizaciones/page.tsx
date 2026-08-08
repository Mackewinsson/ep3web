import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import {
  DataTable,
  EmptyState,
  PageHeader,
  PanelCard,
  StatusBadge,
} from "@/components/panel/ui";
import { db } from "@/db";
import { clients, quoteRequests } from "@/db/schema";
import { formatDate, QUOTE_STATUS_LABELS } from "@/lib/format";
import { convertQuoteToBudget } from "@/lib/actions/quotes";

export default async function CotizacionesPage() {
  const rows = await db
    .select({
      id: quoteRequests.id,
      originAddress: quoteRequests.originAddress,
      destinationAddress: quoteRequests.destinationAddress,
      preferredDate: quoteRequests.preferredDate,
      status: quoteRequests.status,
      clientName: clients.name,
    })
    .from(quoteRequests)
    .innerJoin(clients, eq(quoteRequests.clientId, clients.id))
    .orderBy(desc(quoteRequests.createdAt));

  return (
    <div>
      <PageHeader
        title="Cotizaciones"
        description="Solicitudes de presupuesto de clientes"
        actionHref="/panel/cotizaciones/nueva"
        actionLabel="Nueva cotización"
      />
      <PanelCard>
        {rows.length === 0 ? (
          <EmptyState message="No hay cotizaciones todavía." />
        ) : (
          <DataTable
            headers={["Cliente", "Origen → Destino", "Fecha", "Estado", ""]}
          >
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-ep3-navy/5">
                <td className="px-3 py-2 font-medium text-ep3-navy">
                  {row.clientName}
                </td>
                <td className="px-3 py-2 text-ep3-navy/80">
                  <span className="line-clamp-2">
                    {row.originAddress} → {row.destinationAddress}
                  </span>
                </td>
                <td className="px-3 py-2">{formatDate(row.preferredDate)}</td>
                <td className="px-3 py-2">
                  <StatusBadge
                    label={QUOTE_STATUS_LABELS[row.status] ?? row.status}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  {row.status !== "converted" ? (
                    <form action={convertQuoteToBudget.bind(null, row.id)}>
                      <button
                        type="submit"
                        className="text-sm font-medium text-ep3-navy underline"
                      >
                        Crear presupuesto
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-ep3-navy/50">Convertida</span>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </PanelCard>
    </div>
  );
}
