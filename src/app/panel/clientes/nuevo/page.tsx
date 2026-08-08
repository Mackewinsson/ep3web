import {
  Field,
  PageHeader,
  PanelCard,
  SubmitButton,
  TextArea,
} from "@/components/panel/ui";
import { createClient } from "@/lib/actions/clients";

export default function NuevoClientePage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Nuevo cliente" description="Datos de contacto" />
      <PanelCard>
        <form action={createClient} className="space-y-4">
          <Field label="Nombre" name="name" required />
          <Field label="Teléfono" name="phone" />
          <Field label="Email" name="email" type="email" />
          <TextArea label="Notas" name="notes" />
          <SubmitButton label="Guardar cliente" />
        </form>
      </PanelCard>
    </div>
  );
}
