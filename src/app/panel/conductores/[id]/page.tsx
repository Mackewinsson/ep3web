import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  BackLink,
  Field,
  PageHeader,
  PanelCard,
  SubmitButton,
  TextArea,
} from "@/components/panel/ui";
import { db } from "@/db";
import { drivers } from "@/db/schema";
import { updateDriver } from "@/lib/actions/drivers";

type Props = { params: Promise<{ id: string }> };

export default async function ConductorDetailPage({ params }: Props) {
  const { id } = await params;
  const [driver] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.id, id))
    .limit(1);
  if (!driver) notFound();

  const action = updateDriver.bind(null, id);

  return (
    <div className="mx-auto max-w-xl">
      <BackLink href="/panel/conductores" label="Volver a conductores" />
      <PageHeader title={driver.name} description="Editar conductor" />
      <PanelCard>
        <form action={action} className="space-y-4">
          <Field label="Nombre" name="name" required defaultValue={driver.name} />
          <Field
            label="Email"
            name="email"
            type="email"
            required
            defaultValue={driver.email}
          />
          <Field label="Teléfono" name="phone" defaultValue={driver.phone} />
          <TextArea
            label="Licencia / notas"
            name="licenseNotes"
            defaultValue={driver.licenseNotes}
          />
          <label className="flex items-center gap-2 text-sm text-ep3-navy">
            <input
              type="checkbox"
              name="active"
              defaultChecked={driver.active}
            />
            Activo
          </label>
          <SubmitButton label="Guardar cambios" />
        </form>
      </PanelCard>
    </div>
  );
}
