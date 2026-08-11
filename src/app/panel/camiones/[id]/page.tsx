import { and, asc, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  BackLink,
  PageHeader,
  PanelCard,
  StatusBadge,
  SubmitButton,
} from "@/components/panel/ui";
import { TruckFormFields } from "@/components/panel/truck-form-fields";
import { db } from "@/db";
import { drivers, trucks } from "@/db/schema";
import { updateTruck } from "@/lib/actions/trucks";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import {
  docExpiryLabel,
  docExpiryStatus,
  expiryToneToBadge,
  worstTruckDocTone,
} from "@/lib/truck-docs";

type Props = { params: Promise<{ id: string }> };

export default async function CamionDetailPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;

  const [truck] = await db
    .select()
    .from(trucks)
    .where(eq(trucks.id, id))
    .limit(1);
  if (!truck) notFound();

  const operatorOptions = await db
    .select({ id: drivers.id, name: drivers.name })
    .from(drivers)
    .where(and(isNull(drivers.operatorId), eq(drivers.active, true)))
    .orderBy(asc(drivers.name));

  if (
    truck.operatorId &&
    !operatorOptions.some((o) => o.id === truck.operatorId)
  ) {
    const [owner] = await db
      .select({ id: drivers.id, name: drivers.name })
      .from(drivers)
      .where(eq(drivers.id, truck.operatorId))
      .limit(1);
    if (owner) operatorOptions.unshift(owner);
  }

  const crewOptions = await db
    .select({
      id: drivers.id,
      name: drivers.name,
      operatorId: drivers.operatorId,
    })
    .from(drivers)
    .where(eq(drivers.active, true))
    .orderBy(asc(drivers.name));

  if (
    truck.defaultDriverId &&
    !crewOptions.some((d) => d.id === truck.defaultDriverId)
  ) {
    const [inactive] = await db
      .select({
        id: drivers.id,
        name: drivers.name,
        operatorId: drivers.operatorId,
      })
      .from(drivers)
      .where(eq(drivers.id, truck.defaultDriverId))
      .limit(1);
    if (inactive) crewOptions.unshift(inactive);
  }

  const action = updateTruck.bind(null, id);
  const overall = worstTruckDocTone(truck);

  const docs = [
    {
      label: "Permiso circulación",
      expires: truck.permisoCirculacionExpiresAt,
      detail: truck.permisoCirculacionNumber,
    },
    {
      label: "SOAP",
      expires: truck.soapExpiresAt,
      detail: [truck.soapPolicyNumber, truck.soapInsurer]
        .filter(Boolean)
        .join(" · "),
    },
    {
      label: "Revisión técnica",
      expires: truck.revisionTecnicaExpiresAt,
      detail: truck.revisionTecnicaFolio,
    },
  ] as const;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <BackLink href="/panel/camiones" label="Volver a camiones" />
        <PageHeader
          title={truck.plate}
          description={truck.label ?? "Editar camión"}
        />
      </div>

      <PanelCard>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatusBadge
            label={docExpiryLabel(overall)}
            tone={expiryToneToBadge(overall)}
          />
        </div>
        <ul className="space-y-2 text-sm">
          {docs.map((doc) => {
            const tone = docExpiryStatus(doc.expires);
            return (
              <li
                key={doc.label}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-ep3-navy/10 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-ep3-navy">{doc.label}</p>
                  <p className="text-ep3-navy/60">
                    {doc.detail || "—"} · vence {formatDate(doc.expires)}
                  </p>
                </div>
                <StatusBadge
                  label={docExpiryLabel(tone)}
                  tone={expiryToneToBadge(tone)}
                />
              </li>
            );
          })}
        </ul>
      </PanelCard>

      <PanelCard>
        {operatorOptions.length === 0 ? (
          <p className="text-sm text-amber-800">
            Necesitas al menos un operador para guardar este camión.
          </p>
        ) : (
          <form action={action} className="space-y-4">
            <TruckFormFields
              operatorOptions={operatorOptions}
              crewOptions={crewOptions}
              values={{
                plate: truck.plate,
                label: truck.label,
                capacityNotes: truck.capacityNotes,
                operatorId: truck.operatorId,
                defaultDriverId: truck.defaultDriverId,
                permisoCirculacionNumber: truck.permisoCirculacionNumber,
                permisoCirculacionExpiresAt: truck.permisoCirculacionExpiresAt,
                soapPolicyNumber: truck.soapPolicyNumber,
                soapInsurer: truck.soapInsurer,
                soapExpiresAt: truck.soapExpiresAt,
                revisionTecnicaFolio: truck.revisionTecnicaFolio,
                revisionTecnicaExpiresAt: truck.revisionTecnicaExpiresAt,
                active: truck.active,
              }}
            />
            <SubmitButton label="Guardar cambios" />
          </form>
        )}
      </PanelCard>
    </div>
  );
}
