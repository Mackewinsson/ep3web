import {
  EmptyState,
  PageHeader,
  PanelCard,
  StatusBadge,
} from "@/components/panel/ui";
import { RecordList } from "@/components/panel/record-list";
import { db } from "@/db";
import { trucks } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function CamionesPage() {
  const rows = await db.select().from(trucks).orderBy(desc(trucks.createdAt));

  return (
    <div>
      <PageHeader
        title="Camiones"
        description="Flota disponible para mudanzas"
        actionHref="/panel/camiones/nuevo"
        actionLabel="Nuevo camión"
      />
      <PanelCard>
        {rows.length === 0 ? (
          <EmptyState message="No hay camiones registrados." />
        ) : (
          <RecordList
            emptyMessage="No hay camiones registrados."
            items={rows.map((row) => ({
              id: row.id,
              href: `/panel/camiones/${row.id}`,
              title: row.plate,
              badge: (
                <StatusBadge
                  label={row.active ? "Activo" : "Inactivo"}
                  tone={row.active ? "success" : "default"}
                />
              ),
              fields: [
                { label: "Nombre", value: row.label ?? "—" },
                { label: "Capacidad", value: row.capacityNotes ?? "—" },
              ],
            }))}
          />
        )}
      </PanelCard>
    </div>
  );
}
