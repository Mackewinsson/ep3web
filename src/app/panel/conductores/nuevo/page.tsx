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
          <Field label="Correo" name="email" type="email" required />
          <Field label="Teléfono" name="phone" />
          <TextArea label="Licencia / notas" name="licenseNotes" />
          <label className="flex items-center gap-2 text-sm text-ep3-navy">
            <input type="checkbox" name="active" defaultChecked />
            Activo
          </label>

          <div className="rounded-md border border-dashed border-ep3-navy/20 p-3 space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-ep3-navy">
              <input type="checkbox" name="enableAppAccess" defaultChecked />
              Activar acceso de camionero
            </label>
            <p className="text-xs text-ep3-navy/60">
              Crea el usuario de panel (mismo correo) y lo vincula al conductor.
              Sin esto no puede entrar a Mis trabajos ni recibir notificaciones
              al asignarle un trabajo.
            </p>
            <Field
              label="Contraseña de acceso"
              name="appPassword"
              type="password"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <SubmitButton label="Guardar conductor" />
        </form>
      </PanelCard>
    </div>
  );
}
