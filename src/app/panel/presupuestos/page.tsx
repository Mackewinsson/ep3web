import {
  EmptyState,
  PageHeader,
  PanelCard,
  StatusBadge,
} from "@/components/panel/ui";
import { RecordList } from "@/components/panel/record-list";
import { db } from "@/db";
import { budgets, clients } from "@/db/schema";
import { BUDGET_STATUS_LABELS, budgetStatusTone, formatClp, formatDate } from "@/lib/format";
import { desc, eq } from "drizzle-orm";

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
          <RecordList
            emptyMessage="No hay presupuestos."
            items={rows.map((row) => ({
              id: row.id,
              href: `/panel/presupuestos/${row.id}`,
              title: row.title,
              badge: (
                <StatusBadge
                  label={BUDGET_STATUS_LABELS[row.status] ?? row.status}
                  tone={budgetStatusTone(row.status)}
                />
              ),
              fields: [
                { label: "Cliente", value: row.clientName },
                { label: "Total", value: formatClp(row.totalAmount) },
                { label: "Válido hasta", value: formatDate(row.validUntil) },
              ],
            }))}
          />
        )}
      </PanelCard>
    </div>
  );
}
