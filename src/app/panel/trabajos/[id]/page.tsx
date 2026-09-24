import { and, asc, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmActionForm } from "@/components/panel/confirm-action-form";
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
import { QuoteItemsGrid } from "@/components/panel/quote-items-grid";
import { db } from "@/db";
import { drivers, jobAssignments, staffUsers, trucks } from "@/db/schema";
import {
  assignJob,
  updateJobSchedule,
  updateJobStatus,
} from "@/lib/actions/jobs";
import {
  ASSIGNMENT_END_REASON_LABELS,
  adminJobBadge,
  formatClp,
  formatClpPlusIva,
  formatDate,
} from "@/lib/format";
import { isReadyForEnCamino, jobIsLocked } from "@/lib/job-lifecycle";
import {
  formatVolume,
  getJobOperationalDetail,
  mapsUrl,
  operationalJobNotes,
  operatorFacingAmounts,
} from "@/lib/jobs-view";
import { getBudgetVolumeBreakdown } from "@/lib/volume-breakdown";

type Props = { params: Promise<{ id: string }> };

const crewDrivers = alias(drivers, "crew_drivers");

export default async function TrabajoDetailPage({ params }: Props) {
  const { id } = await params;
  const job = await getJobOperationalDetail(id);
  if (!job) notFound();
  const { operatorPayout, marginPercent } = await operatorFacingAmounts(
    job.clientTotalAmount,
    {
      volumeNotes: job.volumeNotes,
      jobNotes: job.notes,
      estimatedM3: job.estimatedM3,
    },
  );

  const assignments = await db
    .select({
      id: jobAssignments.id,
      assignedAt: jobAssignments.assignedAt,
      emailSentAt: jobAssignments.emailSentAt,
      notes: jobAssignments.notes,
      driverId: jobAssignments.driverId,
      truckId: jobAssignments.truckId,
      endedAt: jobAssignments.endedAt,
      endReason: jobAssignments.endReason,
      driverName: drivers.name,
      driverEmail: drivers.email,
      truckPlate: trucks.plate,
      truckLabel: trucks.label,
      crewDriverName: crewDrivers.name,
      crewDriverRut: jobAssignments.crewDriverRut,
      salvoConductoCompletedAt: jobAssignments.salvoConductoCompletedAt,
    })
    .from(jobAssignments)
    .innerJoin(drivers, eq(jobAssignments.driverId, drivers.id))
    .leftJoin(trucks, eq(jobAssignments.truckId, trucks.id))
    .leftJoin(crewDrivers, eq(jobAssignments.crewDriverId, crewDrivers.id))
    .where(eq(jobAssignments.jobId, id))
    .orderBy(desc(jobAssignments.assignedAt));

  const openAssignment = assignments.find((a) => !a.endedAt) ?? null;
  const locked = jobIsLocked(job.status);
  const readyForEnCamino = isReadyForEnCamino(job.assignment);

  const activeOperators = await db
    .select({ id: drivers.id, name: drivers.name, email: drivers.email })
    .from(drivers)
    .where(and(eq(drivers.active, true), isNull(drivers.operatorId)))
    .orderBy(asc(drivers.name));

  const operatorOptions = [...activeOperators];
  if (
    openAssignment &&
    !operatorOptions.some((d) => d.id === openAssignment.driverId)
  ) {
    operatorOptions.unshift({
      id: openAssignment.driverId,
      name: openAssignment.driverName,
      email: openAssignment.driverEmail,
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
  const operatorsWithAppAccess = new Set(
    driverLogins
      .map((l) => l.driverId)
      .filter((oid): oid is string => Boolean(oid)),
  );

  const assignAction = assignJob.bind(null, id);
  const scheduleAction = updateJobSchedule.bind(null, id);
  const volume = formatVolume(job.estimatedM3, job.estimatedItems);
  const volumeBreakdown = job.budgetId
    ? await getBudgetVolumeBreakdown(job.budgetId, job.estimatedM3)
    : null;
  const when = [formatDate(job.scheduledDate), job.scheduledTime]
    .filter(Boolean)
    .join(" · ");
  const statusBadge = adminJobBadge(job.status, readyForEnCamino);
  const jobNotes = operationalJobNotes(job.notes, job.volumeNotes);

  return (
    <div className="space-y-6">
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
            label={statusBadge.label}
            tone={statusBadge.tone}
          />
        </div>
        {job.status === "assigned" && readyForEnCamino ? (
          <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
            Servicio aceptado
            {job.assignment?.crewDriverName
              ? ` · ${job.assignment.crewDriverName}`
              : ""}
            {job.assignment?.truckPlate
              ? ` · ${job.assignment.truckPlate}`
              : ""}
            {job.assignment?.crewDriverRut
              ? ` · RUT ${job.assignment.crewDriverRut}`
              : ""}
            .
          </p>
        ) : null}
        {job.status === "in_progress" ? (
          <p className="mb-4 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-950">
            Aviso al cliente (simulado): se envió correo de que su mudanza va en
            camino
            {job.clientEmail ? ` a ${job.clientEmail}` : " (sin correo)"}.
          </p>
        ) : null}
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ep3-navy/60">Cliente</dt>
            <dd className="font-medium text-ep3-navy">{job.clientName}</dd>
          </div>
          <div>
            <dt className="text-ep3-navy/60">Presupuesto cliente</dt>
            <dd className="font-medium text-ep3-navy">
              {job.clientTotalAmount
                ? formatClpPlusIva(job.clientTotalAmount)
                : "—"}
              {job.budgetId ? (
                <>
                  {" · "}
                  <Link
                    href={`/panel/presupuestos/${job.budgetId}`}
                    className="underline"
                  >
                    Ver inventario
                  </Link>
                </>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-ep3-navy/60">
              Pago operador (−{marginPercent}% comisión app)
            </dt>
            <dd className="font-medium text-ep3-navy">
              {operatorPayout != null ? formatClp(operatorPayout) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-ep3-navy/60">Operador</dt>
            <dd className="font-medium text-ep3-navy">
              {job.assignment?.driverName ?? "Sin asignar"}
            </dd>
          </div>
          <div>
            <dt className="text-ep3-navy/60">Camión</dt>
            <dd className="font-medium text-ep3-navy">
              {job.assignment?.truckPlate
                ? `${job.assignment.truckPlate}${
                    job.assignment.truckLabel
                      ? ` · ${job.assignment.truckLabel}`
                      : ""
                  }`
                : job.assignment
                  ? "Pendiente (aceptación)"
                  : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-ep3-navy/60">Conductor (flota)</dt>
            <dd className="font-medium text-ep3-navy">
              {job.assignment?.crewDriverName ??
                (job.assignment ? "Pendiente (aceptación)" : "—")}
            </dd>
          </div>
          <div>
            <dt className="text-ep3-navy/60">RUT chofer</dt>
            <dd className="font-medium text-ep3-navy">
              {job.assignment?.crewDriverRut ??
                (job.assignment ? "Pendiente" : "—")}
            </dd>
          </div>
          <div>
            <dt className="text-ep3-navy/60">Aceptación</dt>
            <dd className="font-medium text-ep3-navy">
              {job.assignment?.salvoConductoCompletedAt
                ? "Aceptado"
                : job.assignment
                  ? "Pendiente"
                  : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-ep3-navy/60">Teléfono</dt>
            <dd className="font-medium text-ep3-navy">
              {job.clientPhone ? (
                <a
                  href={`tel:${job.clientPhone}`}
                  className="inline-flex min-h-11 items-center underline"
                >
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
          {volume && volumeBreakdown?.chargedM3 == null ? (
            <div>
              <dt className="text-ep3-navy/60">Carga</dt>
              <dd className="text-ep3-navy">{volume}</dd>
            </div>
          ) : null}
          {job.volumeNotes ? (
            <div className="sm:col-span-2">
              <dt className="text-ep3-navy/60">Detalle volumen</dt>
              <dd className="whitespace-pre-line text-ep3-navy">
                {job.volumeNotes}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {job.status === "assigned" && readyForEnCamino ? (
            <form
              action={updateJobStatus.bind(null, id, "in_progress")}
              className="w-full sm:w-auto"
            >
              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-ep3-navy px-3 py-2 text-sm text-white sm:w-auto"
              >
                Marcar en camino
              </button>
            </form>
          ) : null}
          {job.status === "assigned" && !readyForEnCamino ? (
            <p className="w-full text-sm text-ep3-navy/60">
              El operador aún no registró chofer, RUT y patente.
            </p>
          ) : null}
          {job.status === "in_progress" ? (
            <form
              action={updateJobStatus.bind(null, id, "completed")}
              className="w-full sm:w-auto"
            >
              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-emerald-700 px-3 py-2 text-sm text-white sm:w-auto"
              >
                Finalizar
              </button>
            </form>
          ) : null}
          {!locked ? (
            <ConfirmActionForm
              action={updateJobStatus.bind(null, id, "cancelled")}
              triggerLabel="Cancelar"
              title="Cancelar trabajo"
              description="El operador será notificado y el trabajo quedará cerrado."
              confirmLabel="Confirmar cancelación"
              triggerClassName="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 sm:w-auto"
              confirmClassName="min-h-11 w-full rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white"
            />
          ) : null}
        </div>
      </PanelCard>

      {volumeBreakdown ? (
        <QuoteItemsGrid
          breakdown={volumeBreakdown}
          source="budget"
          title="Ítems de la mudanza"
          description="El mismo desglose que ve el operador. Esta tabla no muestra precios."
        />
      ) : null}

      <PanelCard>
        <h2 className="mb-3 font-semibold text-ep3-navy">Fecha y hora</h2>
        {locked ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ep3-navy/60">Fecha</dt>
              <dd className="font-medium text-ep3-navy">
                {formatDate(job.scheduledDate)}
              </dd>
            </div>
            <div>
              <dt className="text-ep3-navy/60">Hora</dt>
              <dd className="font-medium text-ep3-navy">
                {job.scheduledTime || "—"}
              </dd>
            </div>
            {jobNotes ? (
              <div className="sm:col-span-2">
                <dt className="text-ep3-navy/60">Notas del trabajo</dt>
                <dd className="whitespace-pre-line text-ep3-navy">{jobNotes}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
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
                defaultValue={jobNotes ?? ""}
              />
            </div>
            <div className="sm:col-span-2">
              <SubmitButton label="Guardar programación" />
            </div>
          </form>
        )}
      </PanelCard>

      <PanelCard>
        <h2 className="mb-3 font-semibold text-ep3-navy">Asignaciones</h2>
        {assignments.length === 0 ? (
          <p className="mb-4 text-sm text-ep3-navy/60">
            Todavía sin operador asignado.
          </p>
        ) : (
          <ul className="mb-4 space-y-3">
            {assignments.map((a) => (
              <li
                key={a.id}
                className="rounded-md border border-ep3-navy/10 p-3 text-sm"
              >
                <p className="font-medium text-ep3-navy">
                  Operador: {a.driverName}
                </p>
                <p className="mt-1 text-ep3-navy/80">
                  {a.truckPlate
                    ? `${a.truckPlate}${a.truckLabel ? ` (${a.truckLabel})` : ""}`
                    : "Camión pendiente"}
                  {a.crewDriverName ? ` · Conductor: ${a.crewDriverName}` : ""}
                </p>
                <p className="text-ep3-navy/70">{a.driverEmail}</p>
                {a.notes ? (
                  <p className="mt-1 text-ep3-navy/80">Notas: {a.notes}</p>
                ) : null}
                <div className="mt-2 space-y-0.5 text-xs text-ep3-navy/60">
                  <p>
                    {a.endedAt
                      ? ASSIGNMENT_END_REASON_LABELS[a.endReason ?? ""] ??
                        "Cerrado"
                      : "Actual"}
                    {" · "}
                    Asignado {formatDate(a.assignedAt)}
                  </p>
                  <p>
                    {a.emailSentAt ? "Correo enviado" : "Correo pendiente"}
                    {" · "}
                    {a.salvoConductoCompletedAt
                      ? `Aceptado${a.crewDriverRut ? ` · RUT ${a.crewDriverRut}` : ""}`
                      : "Sin aceptar aún"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!locked &&
        (job.status === "pending_assignment" || job.status === "assigned") ? (
          operatorOptions.length === 0 ? (
            <p className="text-sm text-amber-800">
              Necesitas al menos un operador activo para asignar.
            </p>
          ) : (
            <form
              action={assignAction}
              className="space-y-4 border-t border-ep3-navy/10 pt-4"
            >
              <h3 className="font-medium text-ep3-navy">
                {openAssignment ? "Reasignar operador" : "Asignar operador"}
              </h3>
              <SelectField
                label="Operador"
                name="driverId"
                required
                defaultValue={openAssignment?.driverId}
                options={operatorOptions.map((d) => ({
                  value: d.id,
                  label: operatorsWithAppAccess.has(d.id)
                    ? `${d.name} (${d.email})`
                    : `${d.name} (${d.email}) — sin acceso app`,
                }))}
              />
              <p className="text-xs text-ep3-navy/55">
                El operador aceptará el servicio eligiendo camión, conductor de
                flota (chofer, RUT y patente). Si aparece “sin acceso app”, actívalo en
                Operadores.
              </p>
              <Field
                label="Hora llegada (opcional)"
                name="scheduledTime"
                type="time"
                defaultValue={job.scheduledTime ?? undefined}
              />
              <TextArea
                label="Notas para el operador"
                name="notes"
                defaultValue={openAssignment?.notes}
              />
              <SubmitButton
                label={
                  openAssignment ? "Actualizar asignación" : "Asignar operador"
                }
              />
            </form>
          )
        ) : null}
      </PanelCard>
    </div>
  );
}
