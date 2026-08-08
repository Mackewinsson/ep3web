import {
  EmptyState,
  PageHeader,
  PanelCard,
  StatusBadge,
} from "@/components/panel/ui";
import { RecordList } from "@/components/panel/record-list";
import { db } from "@/db";
import { drivers } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function ConductoresPage() {
  const rows = await db.select().from(drivers).orderBy(desc(drivers.createdAt));

  return (
    <div>
      <PageHeader
        title="Conductores"
        description="Equipo de manejo para mudanzas"
        actionHref="/panel/conductores/nuevo"
        actionLabel="Nuevo conductor"
      />
      <PanelCard>
        {rows.length === 0 ? (
          <EmptyState message="No hay conductores registrados." />
        ) : (
          <RecordList
            emptyMessage="No hay conductores registrados."
            items={rows.map((row) => ({
              id: row.id,
              href: `/panel/conductores/${row.id}`,
              title: row.name,
              badge: (
                <StatusBadge
                  label={row.active ? "Activo" : "Inactivo"}
                  tone={row.active ? "success" : "default"}
                />
              ),
              fields: [
                { label: "Email", value: row.email },
                { label: "Teléfono", value: row.phone ?? "—" },
              ],
            }))}
          />
        )}
      </PanelCard>
    </div>
  );
}
