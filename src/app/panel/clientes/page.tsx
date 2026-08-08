import { desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { clients } from "@/db/schema";
import {
  DataTable,
  EmptyState,
  PageHeader,
  PanelCard,
} from "@/components/panel/ui";

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
          <DataTable headers={["Nombre", "Teléfono", "Email", ""]}>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-ep3-navy/5">
                <td className="px-3 py-2 font-medium text-ep3-navy">
                  {row.name}
                </td>
                <td className="px-3 py-2 text-ep3-navy/80">{row.phone ?? "—"}</td>
                <td className="px-3 py-2 text-ep3-navy/80">{row.email ?? "—"}</td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/panel/clientes/${row.id}`}
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
