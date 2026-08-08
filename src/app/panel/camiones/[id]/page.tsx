import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  Field,
  PageHeader,
  PanelCard,
  SubmitButton,
  TextArea,
} from "@/components/panel/ui";
import { db } from "@/db";
import { trucks } from "@/db/schema";
import { updateTruck } from "@/lib/actions/trucks";

type Props = { params: Promise<{ id: string }> };

export default async function CamionDetailPage({ params }: Props) {
  const { id } = await params;
  const [truck] = await db
    .select()
    .from(trucks)
    .where(eq(trucks.id, id))
    .limit(1);
  if (!truck) notFound();

  const action = updateTruck.bind(null, id);

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={truck.plate} description="Editar camión" />
      <PanelCard>
        <form action={action} className="space-y-4">
          <Field
            label="Patente"
            name="plate"
            required
            defaultValue={truck.plate}
          />
          <Field label="Nombre / alias" name="label" defaultValue={truck.label} />
          <TextArea
            label="Capacidad / notas"
            name="capacityNotes"
            defaultValue={truck.capacityNotes}
          />
          <label className="flex items-center gap-2 text-sm text-ep3-navy">
            <input type="checkbox" name="active" defaultChecked={truck.active} />
            Activo
          </label>
          <SubmitButton label="Guardar cambios" />
        </form>
      </PanelCard>
    </div>
  );
}
