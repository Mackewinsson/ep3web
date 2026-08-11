import { asc, eq } from "drizzle-orm";
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

  const driverOptions = await db
    .select({ id: drivers.id, name: drivers.name })
    .from(drivers)
    .where(eq(drivers.active, true))
    .orderBy(asc(drivers.name));

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Nuevo camión"
        description="Patente, conductor habitual y documentos vigentes (sin adjuntos)"
      />
      <PanelCard>
        <form action={createTruck} className="space-y-4">
          <TruckFormFields driverOptions={driverOptions} />
          <SubmitButton label="Guardar camión" />
        </form>
      </PanelCard>
    </div>
  );
}
