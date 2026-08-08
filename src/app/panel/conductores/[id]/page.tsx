import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  BackLink,
  Field,
  PageHeader,
  PanelCard,
  StatusBadge,
  SubmitButton,
  TextArea,
} from "@/components/panel/ui";
import { db } from "@/db";
import { drivers, staffUsers } from "@/db/schema";
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

  const [login] = await db
    .select({
      id: staffUsers.id,
      active: staffUsers.active,
      email: staffUsers.email,
    })
    .from(staffUsers)
    .where(eq(staffUsers.driverId, id))
    .limit(1);

  const hasAppAccess = Boolean(login?.active);
  const action = updateDriver.bind(null, id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <BackLink href="/panel/conductores" label="Volver a conductores" />
        <PageHeader title={driver.name} description="Editar conductor" />
      </div>

      <PanelCard>
        <div className="mb-4">
          <StatusBadge
            label={hasAppAccess ? "Tiene acceso app" : "Sin acceso app"}
            tone={hasAppAccess ? "success" : "muted"}
          />
        </div>
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

          <div className="rounded-md border border-dashed border-ep3-navy/20 p-3 space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-ep3-navy">
              <input
                type="checkbox"
                name="enableAppAccess"
                defaultChecked={hasAppAccess}
              />
              Acceso app (camionero)
            </label>
            <p className="text-xs text-ep3-navy/60">
              {hasAppAccess
                ? "Deja la contraseña en blanco para mantener la actual, o escribe una nueva."
                : "Marca la casilla e indica una contraseña para que pueda entrar."}
            </p>
            <Field
              label={hasAppAccess ? "Nueva contraseña (opcional)" : "Contraseña app"}
              name="appPassword"
              type="password"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <SubmitButton label="Guardar cambios" />
        </form>
      </PanelCard>
    </div>
  );
}
