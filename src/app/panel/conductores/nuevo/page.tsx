import { and, asc, eq, isNull } from "drizzle-orm";
import {
  PageHeader,
  PanelCard,
  SubmitButton,
} from "@/components/panel/ui";
import { DriverFormFields } from "@/components/panel/driver-form-fields";
import { db } from "@/db";
import { drivers } from "@/db/schema";
import { createDriver } from "@/lib/actions/drivers";
import { requireAdmin } from "@/lib/auth";

export default async function NuevoConductorPage() {
  await requireAdmin();

  const operatorOptions = await db
    .select({ id: drivers.id, name: drivers.name })
    .from(drivers)
    .where(and(isNull(drivers.operatorId), eq(drivers.active, true)))
    .orderBy(asc(drivers.name));

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Nuevo conductor / operador"
        description="Crea un operador con acceso o un conductor de flota"
      />
      <PanelCard>
        <form action={createDriver} className="space-y-4">
          <DriverFormFields
            operatorOptions={operatorOptions}
            values={{ kind: "operator", enableAppAccess: true }}
          />
          <SubmitButton label="Guardar" />
        </form>
      </PanelCard>
    </div>
  );
}
