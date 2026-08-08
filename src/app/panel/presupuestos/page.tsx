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
import { budgets, clients } from "@/db/schema";
import { BUDGET_STATUS_LABELS, formatClp, formatDate } from "@/lib/format";

function budgetTone(
  status: string,
): "default" | "success" | "warning" | "danger" {
  if (status === "approved") return "success";
  if (status === "sent") return "warning";
  if (status === "rejected" || status === "expired") return "danger";
  return "default";
}

export default async function PresupuestosPage() {
  const rows = await db
    .select({
      id: budgets.id,
      title: budgets.title,
      totalAmount: budgets.totalAmount,
      status: budgets.status,
      validUntil: budgets.validUntil,
      clientName: clients.name,
    })
    .from(budgets)
    .innerJoin(clients, eq(budgets.clientId, clients.id))
    .orderBy(desc(budgets.createdAt));

  return (
    <div>
      <PageHeader
        title="Presupuestos"
        description="Cotizaciones con precio para el cliente"
        actionHref="/panel/presupuestos/nuevo"
        actionLabel="Nuevo presupuesto"
      />
      <PanelCard>
        {rows.length === 0 ? (
          <EmptyState message="No hay presupuestos." />
        ) : (
          <DataTable
            headers={["Título", "Cliente", "Total", "Válido hasta", "Estado", ""]}
          >
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-ep3-navy/5">
                <td className="px-3 py-2 font-medium text-ep3-navy">
                  {row.title}
                </td>
                <td className="px-3 py-2">{row.clientName}</td>
                <td className="px-3 py-2">{formatClp(row.totalAmount)}</td>
                <td className="px-3 py-2">{formatDate(row.validUntil)}</td>
                <td className="px-3 py-2">
                  <StatusBadge
                    label={BUDGET_STATUS_LABELS[row.status] ?? row.status}
                    tone={budgetTone(row.status)}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/panel/presupuestos/${row.id}`}
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
