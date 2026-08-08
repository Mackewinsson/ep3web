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
import { clients, jobs } from "@/db/schema";
import { formatDate, JOB_STATUS_LABELS } from "@/lib/format";

function jobTone(
  status: string,
): "default" | "success" | "warning" | "danger" {
  if (status === "completed") return "success";
  if (status === "pending_assignment") return "warning";
  if (status === "cancelled") return "danger";
  return "default";
}

export default async function TrabajosPage() {
  const rows = await db
    .select({
      id: jobs.id,
      originAddress: jobs.originAddress,
      destinationAddress: jobs.destinationAddress,
      scheduledDate: jobs.scheduledDate,
      status: jobs.status,
      clientName: clients.name,
    })
    .from(jobs)
    .innerJoin(clients, eq(jobs.clientId, clients.id))
    .orderBy(desc(jobs.createdAt));

  return (
    <div>
      <PageHeader
        title="Trabajos"
        description="Mudanzas operativas listas para asignar"
      />
      <PanelCard>
        {rows.length === 0 ? (
          <EmptyState message="No hay trabajos. Aprueba un presupuesto para crear uno." />
        ) : (
          <DataTable
            headers={["Cliente", "Ruta", "Fecha", "Estado", ""]}
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
                <td className="px-3 py-2">{formatDate(row.scheduledDate)}</td>
                <td className="px-3 py-2">
                  <StatusBadge
                    label={JOB_STATUS_LABELS[row.status] ?? row.status}
                    tone={jobTone(row.status)}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/panel/trabajos/${row.id}`}
                    className="text-sm font-medium text-ep3-navy underline"
                  >
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </PanelCard>
    </div>
  );
}
