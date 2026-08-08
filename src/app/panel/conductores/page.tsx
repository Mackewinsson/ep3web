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
import { drivers } from "@/db/schema";

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
          <DataTable headers={["Nombre", "Email", "Teléfono", "Estado", ""]}>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-ep3-navy/5">
                <td className="px-3 py-2 font-medium text-ep3-navy">
                  {row.name}
                </td>
                <td className="px-3 py-2">{row.email}</td>
                <td className="px-3 py-2">{row.phone ?? "—"}</td>
                <td className="px-3 py-2">
                  <StatusBadge
                    label={row.active ? "Activo" : "Inactivo"}
                    tone={row.active ? "success" : "default"}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/panel/conductores/${row.id}`}
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
