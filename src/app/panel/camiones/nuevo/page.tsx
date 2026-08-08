import {
  Field,
  PageHeader,
  PanelCard,
  SubmitButton,
  TextArea,
} from "@/components/panel/ui";
import { createTruck } from "@/lib/actions/trucks";

export default function NuevoCamionPage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Nuevo camión" />
      <PanelCard>
        <form action={createTruck} className="space-y-4">
          <Field label="Patente" name="plate" required placeholder="ABCD12" />
          <Field label="Nombre / alias" name="label" placeholder="Camión 1" />
          <TextArea label="Capacidad / notas" name="capacityNotes" />
          <label className="flex items-center gap-2 text-sm text-ep3-navy">
            <input type="checkbox" name="active" defaultChecked />
            Activo
          </label>
          <SubmitButton label="Guardar camión" />
        </form>
      </PanelCard>
    </div>
  );
}
