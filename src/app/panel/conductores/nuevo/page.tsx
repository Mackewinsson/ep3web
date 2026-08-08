import {
  Field,
  PageHeader,
  PanelCard,
  SubmitButton,
  TextArea,
} from "@/components/panel/ui";
import { createDriver } from "@/lib/actions/drivers";

export default function NuevoConductorPage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Nuevo conductor" />
      <PanelCard>
        <form action={createDriver} className="space-y-4">
          <Field label="Nombre" name="name" required />
          <Field label="Email" name="email" type="email" required />
          <Field label="Teléfono" name="phone" />
          <TextArea label="Licencia / notas" name="licenseNotes" />
          <label className="flex items-center gap-2 text-sm text-ep3-navy">
            <input type="checkbox" name="active" defaultChecked />
            Activo
          </label>
          <SubmitButton label="Guardar conductor" />
        </form>
      </PanelCard>
    </div>
  );
}
