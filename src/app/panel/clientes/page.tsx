import {
  EmptyState,
  PageHeader,
  PanelCard,
  StatusBadge,
} from "@/components/panel/ui";
import { RecordList } from "@/components/panel/record-list";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function ClientesPage() {
  const rows = await db.select().from(clients).orderBy(desc(clients.createdAt));

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Contactos de mudanzas y fletes"
        actionHref="/panel/clientes/nuevo"
        actionLabel="Nuevo cliente"
      />
      <PanelCard>
        {rows.length === 0 ? (
          <EmptyState message="Aún no hay clientes. Crea el primero." />
        ) : (
          <RecordList
            emptyMessage="Aún no hay clientes. Crea el primero."
            items={rows.map((row) => ({
              id: row.id,
              href: `/panel/clientes/${row.id}`,
              title: row.name,
              fields: [
                { label: "Teléfono", value: row.phone ?? "—" },
                { label: "Correo", value: row.email ?? "—" },
              ],
            }))}
          />
        )}
      </PanelCard>
    </div>
  );
}
