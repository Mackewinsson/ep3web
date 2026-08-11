import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  BackLink,
  Field,
  PageHeader,
  PanelCard,
  SelectField,
  StatusBadge,
  SubmitButton,
  TextArea,
} from "@/components/panel/ui";
import { db } from "@/db";
import { drivers, jobAssignments, staffUsers, trucks } from "@/db/schema";
import {
  assignJob,
  updateJobSchedule,
  updateJobStatus,
} from "@/lib/actions/jobs";
import { formatDate, JOB_STATUS_LABELS, jobStatusTone } from "@/lib/format";
import {
  formatVolume,
  getJobOperationalDetail,
  mapsUrl,
} from "@/lib/jobs-view";

type Props = { params: Promise<{ id: string }> };

export default async function TrabajoDetailPage({ params }: Props) {
  const { id } = await params;
  const job = await getJobOperationalDetail(id);
  if (!job) notFound();

  const assignments = await db
    .select({
      id: jobAssignments.id,
      assignedAt: jobAssignments.assignedAt,
      emailSentAt: jobAssignments.emailSentAt,
      notes: jobAssignments.notes,
      driverId: jobAssignments.driverId,
      truckId: jobAssignments.truckId,
      driverName: drivers.name,
      driverEmail: drivers.email,
      truckPlate: trucks.plate,
      truckLabel: trucks.label,
      salvoConductoFolio: jobAssignments.salvoConductoFolio,
      salvoConductoCompletedAt: jobAssignments.salvoConductoCompletedAt,
    })
    .from(jobAssignments)
    .innerJoin(drivers, eq(jobAssignments.driverId, drivers.id))
    .leftJoin(trucks, eq(jobAssignments.truckId, trucks.id))
    .where(eq(jobAssignments.jobId, id))
    .orderBy(desc(jobAssignments.assignedAt));

  const latestAssignment = assignments[0] ?? null;

  const activeDrivers = await db
    .select({ id: drivers.id, name: drivers.name, email: drivers.email })
    .from(drivers)
    .where(eq(drivers.active, true))
    .orderBy(asc(drivers.name));

  // Keep current assignee selectable even if marked inactive
  const driverOptions = [...activeDrivers];
  if (
    latestAssignment &&
    !driverOptions.some((d) => d.id === latestAssignment.driverId)
  ) {
    driverOptions.unshift({
      id: latestAssignment.driverId,
      name: latestAssignment.driverName,
      email: latestAssignment.driverEmail,
    });
  }

  const driverLogins = await db
    .select({ driverId: staffUsers.driverId })
    .from(staffUsers)
    .where(
      and(
        eq(staffUsers.role, "driver"),
        eq(staffUsers.active, true),
        isNotNull(staffUsers.driverId),
      ),
    );
  const driversWithAppAccess = new Set(
    driverLogins
      .map((l) => l.driverId)
      .filter((id): id is string => Boolean(id)),
  );

  const activeTrucks = await db
    .select({ id: trucks.id, plate: trucks.plate, label: trucks.label })
    .from(trucks)
    .where(eq(trucks.active, true))
    .orderBy(asc(trucks.plate));

  const truckOptions = [...activeTrucks];
  if (
    latestAssignment?.truckId &&
    !truckOptions.some((t) => t.id === latestAssignment.truckId)
  ) {
    truckOptions.unshift({
      id: latestAssignment.truckId,
      plate: latestAssignment.truckPlate ?? "—",
      label: latestAssignment.truckLabel,
    });
  }

  const assignAction = assignJob.bind(null, id);
  const scheduleAction = updateJobSchedule.bind(null, id);
  const volume = formatVolume(job.estimatedM3, job.estimatedItems);
  const when = [formatDate(job.scheduledDate), job.scheduledTime]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <BackLink href="/panel/trabajos" label="Volver a trabajos" />
        <PageHeader
          title={`Trabajo · ${job.clientName}`}
          description={when ? `Programado: ${when}` : "Sin fecha programada"}
        />
      </div>

      <PanelCard>
        <div className="mb-3">
          <StatusBadge
            label={JOB_STATUS_LABELS[job.status] ?? job.status}
            tone={jobStatusTone(job.status)}
          />
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ep3-navy/60">Cliente</dt>
            <dd className="font-medium text-ep3-navy">{job.clientName}</dd>
          </div>
          <div>
            <dt className="text-ep3-navy/60">Conductor</dt>
            <dd className="font-medium text-ep3-navy">
              {latestAssignment?.driverName ?? "Sin asignar"}
            </dd>
          </div>
          <div>
            <dt className="text-ep3-navy/60">Camión</dt>
            <dd className="font-medium text-ep3-navy">
              {latestAssignment?.truckPlate
                ? `${latestAssignment.truckPlate}${
                    latestAssignment.truckLabel
                      ? ` · ${latestAssignment.truckLabel}`
                      : ""
                  }`
                : latestAssignment
                  ? "Pendiente (elige el conductor)"
                  : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-ep3-navy/60">Salvo conducto</dt>
            <dd className="font-medium text-ep3-navy">
              {latestAssignment?.salvoConductoCompletedAt
                ? `Registrado${
                    latestAssignment.salvoConductoFolio
                      ? ` · ${latestAssignment.salvoConductoFolio}`
                      : ""
                  }`
                : latestAssignment
                  ? "Pendiente"
                  : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-ep3-navy/60">Teléfono</dt>
            <dd className="font-medium text-ep3-navy">
              {job.clientPhone ? (
                <a href={`tel:${job.clientPhone}`} className="underline">
                  {job.clientPhone}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          {job.clientEmail ? (
            <div className="sm:col-span-2">
              <dt className="text-ep3-navy/60">Correo</dt>
              <dd className="text-ep3-navy">{job.clientEmail}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-ep3-navy/60">Origen</dt>
            <dd className="font-medium text-ep3-navy">
              <a
                href={mapsUrl(job.originAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {job.originAddress}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-ep3-navy/60">Destino</dt>
            <dd className="font-medium text-ep3-navy">
              <a
                href={mapsUrl(job.destinationAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {job.destinationAddress}
              </a>
            </dd>
          </div>
          {volume ? (
            <div>
              <dt className="text-ep3-navy/60">Carga</dt>
              <dd className="text-ep3-navy">{volume}</dd>
            </div>
          ) : null}
          {job.volumeNotes ? (
            <div className="sm:col-span-2">
              <dt className="text-ep3-navy/60">Detalle volumen</dt>
              <dd className="text-ep3-navy">{job.volumeNotes}</dd>
            </div>
          ) : null}
          {job.notes ? (
            <div className="sm:col-span-2">
              <dt className="text-ep3-navy/60">Notas</dt>
              <dd className="text-ep3-navy">{job.notes}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          {job.status === "assigned" ? (
            <form action={updateJobStatus.bind(null, id, "in_progress")}>
              <button
                type="submit"
                className="min-h-11 rounded-md bg-ep3-navy px-3 py-2 text-sm text-white"
              >
                Marcar en camino
              </button>
            </form>
          ) : null}
          {job.status === "in_progress" ? (
            <form action={updateJobStatus.bind(null, id, "completed")}>
              <button
                type="submit"
                className="min-h-11 rounded-md bg-emerald-700 px-3 py-2 text-sm text-white"
              >
                Finalizar
              </button>
            </form>
          ) : null}
          {job.status !== "completed" && job.status !== "cancelled" ? (
            <form action={updateJobStatus.bind(null, id, "cancelled")}>
              <button
                type="submit"
                className="min-h-11 rounded-md border border-red-300 px-3 py-2 text-sm text-red-700"
              >
                Cancelar
              </button>
            </form>
          ) : null}
        </div>
      </PanelCard>

      <PanelCard>
        <h2 className="mb-3 font-semibold text-ep3-navy">Fecha y hora</h2>
        <form action={scheduleAction} className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Fecha"
            name="scheduledDate"
            type="date"
            defaultValue={job.scheduledDate ?? undefined}
          />
          <Field
            label="Hora"
            name="scheduledTime"
            type="time"
            defaultValue={job.scheduledTime ?? undefined}
          />
          <div className="sm:col-span-2">
            <TextArea
              label="Notas del trabajo"
              name="notes"
              defaultValue={job.notes}
            />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton label="Guardar programación" />
          </div>
        </form>
      </PanelCard>

      <PanelCard>
        <h2 className="mb-3 font-semibold text-ep3-navy">Asignaciones</h2>
        {assignments.length === 0 ? (
          <p className="mb-4 text-sm text-ep3-navy/60">
            Todavía sin conductor asignado.
          </p>
        ) : (
          <ul className="mb-4 space-y-3">
            {assignments.map((a) => (
              <li
                key={a.id}
                className="rounded-md border border-ep3-navy/10 p-3 text-sm"
              >
                <p className="font-medium text-ep3-navy">
                  {a.driverName}
                  {a.truckPlate
                    ? ` · ${a.truckPlate}${a.truckLabel ? ` (${a.truckLabel})` : ""}`
                    : " · Camión pendiente"}
                </p>
                <p className="text-ep3-navy/70">{a.driverEmail}</p>
                {a.notes ? (
                  <p className="mt-1 text-ep3-navy/80">Notas: {a.notes}</p>
                ) : null}
                <p className="mt-1 text-xs text-ep3-navy/60">
                  Asignado {formatDate(a.assignedAt)}
                  {a.emailSentAt
                    ? " · Correo enviado"
                    : " · Correo pendiente"}
                  {a.salvoConductoCompletedAt
                    ? ` · Salvo conducto ${a.salvoConductoFolio ?? "OK"}`
                    : " · Sin salvo conducto"}
                </p>
              </li>
            ))}
          </ul>
        )}

        {job.status === "pending_assignment" || job.status === "assigned" ? (
          driverOptions.length === 0 ? (
            <p className="text-sm text-amber-800">
              Necesitas al menos un conductor activo para asignar.
            </p>
          ) : (
            <form
              action={assignAction}
              className="space-y-4 border-t border-ep3-navy/10 pt-4"
            >
              <h3 className="font-medium text-ep3-navy">
                {latestAssignment
                  ? "Reasignar conductor"
                  : "Asignar conductor"}
              </h3>
              <SelectField
                label="Conductor"
                name="driverId"
                required
                defaultValue={latestAssignment?.driverId}
                options={driverOptions.map((d) => ({
                  value: d.id,
                  label: driversWithAppAccess.has(d.id)
                    ? `${d.name} (${d.email})`
                    : `${d.name} (${d.email}) — sin acceso app`,
                }))}
              />
              <p className="text-xs text-ep3-navy/55">
                Si el conductor aparece “sin acceso app”, actívalo en Conductores
                o no recibirá notificaciones ni verá Mis trabajos.
              </p>
              <SelectField
                label="Camión (opcional)"
                name="truckId"
                required
                defaultValue={latestAssignment?.truckId ?? "none"}
                options={[
                  {
                    value: "none",
                    label: "Lo elige el conductor",
                  },
                  ...truckOptions.map((t) => ({
                    value: t.id,
                    label: t.label ? `${t.plate} — ${t.label}` : t.plate,
                  })),
                ]}
              />
              <p className="text-xs text-ep3-navy/55">
                Si dejas “Lo elige el conductor”, el camionero debe elegir el
                camión y registrar el salvo conducto antes de marcar En camino.
              </p>
              <Field
                label="Hora llegada (opcional)"
                name="scheduledTime"
                type="time"
                defaultValue={job.scheduledTime ?? undefined}
              />
              <TextArea
                label="Notas para el conductor"
                name="notes"
                defaultValue={latestAssignment?.notes}
              />
              <SubmitButton
                label={
                  latestAssignment ? "Actualizar asignación" : "Asignar conductor"
                }
              />
            </form>
          )
        ) : null}
      </PanelCard>
    </div>
  );
}
