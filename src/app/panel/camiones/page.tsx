import { desc, eq } from "drizzle-orm";
import {
  EmptyState,
  PageHeader,
  PanelCard,
  StatusBadge,
} from "@/components/panel/ui";
import { RecordList } from "@/components/panel/record-list";
import { db } from "@/db";
import { drivers, trucks } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import {
  docExpiryLabel,
  expiryToneToBadge,
  worstTruckDocTone,
} from "@/lib/truck-docs";

export default async function CamionesPage() {
  await requireAdmin();

  const rows = await db
    .select({
      id: trucks.id,
      plate: trucks.plate,
      label: trucks.label,
      capacityNotes: trucks.capacityNotes,
      active: trucks.active,
      defaultDriverName: drivers.name,
      permisoCirculacionExpiresAt: trucks.permisoCirculacionExpiresAt,
      soapExpiresAt: trucks.soapExpiresAt,
      revisionTecnicaExpiresAt: trucks.revisionTecnicaExpiresAt,
    })
    .from(trucks)
    .leftJoin(drivers, eq(trucks.defaultDriverId, drivers.id))
    .orderBy(desc(trucks.createdAt));

  return (
    <div>
      <PageHeader
        title="Camiones"
        description="Flota, documentos vigentes y conductor habitual"
        actionHref="/panel/camiones/nuevo"
        actionLabel="Nuevo camión"
      />
      <PanelCard>
        {rows.length === 0 ? (
          <EmptyState message="No hay camiones registrados." />
        ) : (
          <RecordList
            emptyMessage="No hay camiones registrados."
            items={rows.map((row) => {
              const docsTone = worstTruckDocTone(row);
              return {
                id: row.id,
                href: `/panel/camiones/${row.id}`,
                title: row.plate,
                badge: (
                  <div className="flex flex-wrap gap-1">
                    <StatusBadge
                      label={row.active ? "Activo" : "Inactivo"}
                      tone={row.active ? "success" : "muted"}
                    />
                    <StatusBadge
                      label={docExpiryLabel(docsTone)}
                      tone={expiryToneToBadge(docsTone)}
                    />
                  </div>
                ),
                fields: [
                  { label: "Nombre", value: row.label ?? "—" },
                  {
                    label: "Conductor",
                    value: row.defaultDriverName ?? "Sin habitual",
                  },
                  {
                    label: "Permiso",
                    value: formatDate(row.permisoCirculacionExpiresAt),
                  },
                  {
                    label: "SOAP",
                    value: formatDate(row.soapExpiresAt),
                  },
                  {
                    label: "Rev. técnica",
                    value: formatDate(row.revisionTecnicaExpiresAt),
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
