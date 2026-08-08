import { and, desc, eq, isNotNull } from "drizzle-orm";
import {
  EmptyState,
  PageHeader,
  PanelCard,
  StatusBadge,
} from "@/components/panel/ui";
import { RecordList } from "@/components/panel/record-list";
import { db } from "@/db";
import { drivers, staffUsers } from "@/db/schema";

export default async function ConductoresPage() {
  const rows = await db.select().from(drivers).orderBy(desc(drivers.createdAt));

  const logins = await db
    .select({
      driverId: staffUsers.driverId,
      active: staffUsers.active,
    })
    .from(staffUsers)
    .where(and(eq(staffUsers.role, "driver"), isNotNull(staffUsers.driverId)));

  const loginByDriver = new Map(
    logins
      .filter((l): l is { driverId: string; active: boolean } => Boolean(l.driverId))
      .map((l) => [l.driverId, l.active]),
  );

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
            items={rows.map((row) => {
              const appActive = loginByDriver.get(row.id) === true;
              return {
                id: row.id,
                href: `/panel/conductores/${row.id}`,
                title: row.name,
                badge: (
                  <StatusBadge
                    label={row.active ? "Activo" : "Inactivo"}
                    tone={row.active ? "success" : "muted"}
                  />
                ),
                fields: [
                  { label: "Email", value: row.email },
                  { label: "Teléfono", value: row.phone ?? "—" },
                  {
                    label: "App",
                    value: (
                      <StatusBadge
                        label={appActive ? "Con acceso" : "Sin acceso"}
                        tone={appActive ? "success" : "muted"}
                      />
                    ),
                  },
                ],
              };
            })}
          />
        )}
      </PanelCard>
    </div>
  );
}
