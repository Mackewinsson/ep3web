import { and, asc, eq, isNull } from "drizzle-orm";
import {
  PageHeader,
  PanelCard,
  SubmitButton,
} from "@/components/panel/ui";
import { TruckFormFields } from "@/components/panel/truck-form-fields";
import { db } from "@/db";
import { drivers } from "@/db/schema";
import { createTruck } from "@/lib/actions/trucks";
import { requireAdmin } from "@/lib/auth";

export default async function NuevoCamionPage() {
  await requireAdmin();

  const operatorOptions = await db
    .select({ id: drivers.id, name: drivers.name })
    .from(drivers)
    .where(and(isNull(drivers.operatorId), eq(drivers.active, true)))
    .orderBy(asc(drivers.name));

  const crewOptions = await db
    .select({
      id: drivers.id,
      name: drivers.name,
      operatorId: drivers.operatorId,
    })
    .from(drivers)
    .where(eq(drivers.active, true))
    .orderBy(asc(drivers.name));

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Nuevo camión"
        description="Asigna el camión a un operador y registra documentos vigentes"
      />
      <PanelCard>
        {operatorOptions.length === 0 ? (
          <p className="text-sm text-amber-800">
            Primero crea un operador activo en Conductores.
          </p>
        ) : (
          <form action={createTruck} className="space-y-4">
            <TruckFormFields
              operatorOptions={operatorOptions}
              crewOptions={crewOptions}
            />
            <SubmitButton label="Guardar camión" />
          </form>
        )}
      </PanelCard>
    </div>
  );
}
