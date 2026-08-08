import { desc } from "drizzle-orm";
import Link from "next/link";
import {
  DataTable,
  EmptyState,
  PageHeader,
  PanelCard,
  StatusBadge,
} from "@/components/panel/ui";
import { db } from "@/db";
import { trucks } from "@/db/schema";

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
          <DataTable headers={["Patente", "Nombre", "Capacidad", "Estado", ""]}>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-ep3-navy/5">
                <td className="px-3 py-2 font-medium text-ep3-navy">
                  {row.plate}
                </td>
                <td className="px-3 py-2">{row.label ?? "—"}</td>
                <td className="px-3 py-2">{row.capacityNotes ?? "—"}</td>
                <td className="px-3 py-2">
                  <StatusBadge
                    label={row.active ? "Activo" : "Inactivo"}
                    tone={row.active ? "success" : "default"}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/panel/camiones/${row.id}`}
                    className="text-sm font-medium text-ep3-navy underline"
                  >
                    Ver
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
