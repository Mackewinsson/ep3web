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
        description="Paquetes de mudanza que se muestran en la web y se usan en presupuestos"
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
                  tone={row.active ? "success" : "default"}
                />
              ),
              fields: [
                {
                  label: "Tipo",
                  value: PRICING_UNIT_LABELS[row.pricingType] ?? row.pricingType,
                },
                { label: "Precio base", value: formatClp(row.basePrice) },
                {
                  label: "Home",
                  value: (
                    <StatusBadge
                      label={row.showOnHome ? "Sí" : "No"}
                      tone={row.showOnHome ? "success" : "default"}
                    />
                  ),
                },
              ],
              action: (
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <Link
                    href={`/panel/paquetes/${row.id}`}
                    className="text-sm font-medium text-ep3-navy underline"
                  >
                    Ver
                  </Link>
                  <form action={togglePackageActive.bind(null, row.id)}>
                    <button
                      type="submit"
                      className="min-h-11 rounded-md border border-ep3-navy/15 px-3 py-2 text-sm font-medium text-ep3-navy hover:bg-ep3-navy/5"
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
