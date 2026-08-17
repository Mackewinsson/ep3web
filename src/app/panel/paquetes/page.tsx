import { desc } from "drizzle-orm";
import Link from "next/link";
import {
  EmptyState,
  PageHeader,
  PanelCard,
  StatusBadge,
} from "@/components/panel/ui";
import { RecordList } from "@/components/panel/record-list";
import { db } from "@/db";
import { servicePackages } from "@/db/schema";
import { togglePackageActive } from "@/lib/actions/packages";
import { formatClp, PRICING_UNIT_LABELS } from "@/lib/format";

export default async function PaquetesPage() {
  const rows = await db
    .select()
    .from(servicePackages)
    .orderBy(desc(servicePackages.sortOrder), desc(servicePackages.createdAt));

  return (
    <div>
      <PageHeader
        title="Paquetes"
        description="Paquetes de mudanza que se muestran en el sitio y se usan en presupuestos"
        actionHref="/panel/paquetes/nuevo"
        actionLabel="Nuevo paquete"
      />
      <PanelCard>
        {rows.length === 0 ? (
          <EmptyState message="Aún no hay paquetes. Crea el primero." />
        ) : (
          <RecordList
            emptyMessage="Aún no hay paquetes. Crea el primero."
            items={rows.map((row) => ({
              id: row.id,
              href: `/panel/paquetes/${row.id}`,
              title: row.name,
              badge: (
                <StatusBadge
                  label={row.active ? "Activo" : "Inactivo"}
                  tone={row.active ? "success" : "muted"}
                />
              ),
              fields: [
                {
                  label: "Tipo",
                  value: PRICING_UNIT_LABELS[row.pricingType] ?? row.pricingType,
                },
                { label: "Precio base", value: formatClp(row.basePrice) },
                {
                  label: "En el sitio",
                  value: (
                    <StatusBadge
                      label={row.showOnHome ? "Sí" : "No"}
                      tone={row.showOnHome ? "success" : "muted"}
                    />
                  ),
                },
              ],
              action: (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                  <Link
                    href={`/panel/paquetes/${row.id}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-md border border-ep3-navy/15 px-3 text-sm font-medium text-ep3-navy hover:bg-ep3-navy/5"
                  >
                    Ver
                  </Link>
                  <form action={togglePackageActive.bind(null, row.id)}>
                    <button
                      type="submit"
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-ep3-navy/15 px-3 text-sm font-medium text-ep3-navy hover:bg-ep3-navy/5 sm:w-auto"
                    >
                      {row.active ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                </div>
              ),
            }))}
          />
        )}
      </PanelCard>
    </div>
  );
}
