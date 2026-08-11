import { and, desc, eq, isNotNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  EmptyState,
  PageHeader,
  PanelCard,
  StatusBadge,
} from "@/components/panel/ui";
import { RecordList } from "@/components/panel/record-list";
import { db } from "@/db";
import { drivers, staffUsers } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const operators = alias(drivers, "operators");

export default async function ConductoresPage() {
  await requireAdmin();

  const rows = await db
    .select({
      id: drivers.id,
      name: drivers.name,
      email: drivers.email,
      phone: drivers.phone,
      active: drivers.active,
      operatorId: drivers.operatorId,
      operatorName: operators.name,
    })
    .from(drivers)
    .leftJoin(operators, eq(drivers.operatorId, operators.id))
    .orderBy(desc(drivers.createdAt));

  const logins = await db
    .select({
      driverId: staffUsers.driverId,
      active: staffUsers.active,
    })
    .from(staffUsers)
    .where(and(eq(staffUsers.role, "driver"), isNotNull(staffUsers.driverId)));

  const loginByDriver = new Map(
    logins
      .filter((l): l is { driverId: string; active: boolean } =>
        Boolean(l.driverId),
      )
      .map((l) => [l.driverId, l.active]),
  );

  return (
    <div>
      <PageHeader
        title="Conductores y operadores"
        description="Operadores con acceso y conductores de cada flota"
        actionHref="/panel/conductores/nuevo"
        actionLabel="Nuevo"
      />
      <PanelCard>
        {rows.length === 0 ? (
          <EmptyState message="No hay registros." />
        ) : (
          <RecordList
            emptyMessage="No hay registros."
            items={rows.map((row) => {
              const isOperator = !row.operatorId;
              const appActive = loginByDriver.get(row.id) === true;
              return {
                id: row.id,
                href: `/panel/conductores/${row.id}`,
                title: row.name,
                badge: (
                  <div className="flex flex-wrap gap-1">
                    <StatusBadge
                      label={isOperator ? "Operador" : "Flota"}
                      tone={isOperator ? "info" : "default"}
                    />
                    <StatusBadge
                      label={row.active ? "Activo" : "Inactivo"}
                      tone={row.active ? "success" : "muted"}
                    />
                  </div>
                ),
                fields: [
                  { label: "Correo", value: row.email },
                  {
                    label: isOperator ? "Acceso" : "Operador",
                    value: isOperator ? (
                      <StatusBadge
                        label={appActive ? "Con acceso" : "Sin acceso"}
                        tone={appActive ? "success" : "muted"}
                      />
                    ) : (
                      (row.operatorName ?? "—")
                    ),
                  },
                  { label: "Teléfono", value: row.phone ?? "—" },
                ],
              };
            })}
          />
        )}
      </PanelCard>
    </div>
  );
}
