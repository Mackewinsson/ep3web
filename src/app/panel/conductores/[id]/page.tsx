import { and, asc, eq, isNull, ne } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  BackLink,
  PageHeader,
  PanelCard,
  StatusBadge,
  SubmitButton,
} from "@/components/panel/ui";
import { DriverFormFields } from "@/components/panel/driver-form-fields";
import { db } from "@/db";
import { drivers, staffUsers } from "@/db/schema";
import { updateDriver } from "@/lib/actions/drivers";
import { requireAdmin } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

export default async function ConductorDetailPage({ params }: Props) {
  await requireAdmin();
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
  const kind = driver.operatorId ? "crew" : "operator";

  const operatorOptions = await db
    .select({ id: drivers.id, name: drivers.name })
    .from(drivers)
    .where(
      and(
        isNull(drivers.operatorId),
        eq(drivers.active, true),
        ne(drivers.id, id),
      ),
    )
    .orderBy(asc(drivers.name));

  if (
    driver.operatorId &&
    !operatorOptions.some((o) => o.id === driver.operatorId)
  ) {
    const [owner] = await db
      .select({ id: drivers.id, name: drivers.name })
      .from(drivers)
      .where(eq(drivers.id, driver.operatorId))
      .limit(1);
    if (owner) operatorOptions.unshift(owner);
  }

  const action = updateDriver.bind(null, id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <BackLink href="/panel/conductores" label="Volver a conductores" />
        <PageHeader
          title={driver.name}
          description={
            kind === "operator" ? "Editar operador" : "Editar conductor de flota"
          }
        />
      </div>

      <PanelCard>
        <div className="mb-4 flex flex-wrap gap-2">
          <StatusBadge
            label={kind === "operator" ? "Operador" : "Conductor de flota"}
            tone={kind === "operator" ? "info" : "default"}
          />
          {kind === "operator" ? (
            <StatusBadge
              label={hasAppAccess ? "Tiene acceso" : "Sin acceso"}
              tone={hasAppAccess ? "success" : "muted"}
            />
          ) : null}
        </div>
        <form action={action} className="space-y-4">
          <DriverFormFields
            operatorOptions={operatorOptions}
            hasAppAccess={hasAppAccess}
            values={{
              name: driver.name,
              email: driver.email,
              phone: driver.phone,
              licenseNotes: driver.licenseNotes,
              active: driver.active,
              kind,
              operatorId: driver.operatorId,
              enableAppAccess: hasAppAccess,
            }}
          />
          <SubmitButton label="Guardar cambios" />
        </form>
      </PanelCard>
    </div>
  );
}
