import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AcceptServiceModal } from "@/components/panel/accept-service-modal";
import { ConfirmActionForm } from "@/components/panel/confirm-action-form";
import {
  BackLink,
  PageHeader,
  PanelCard,
  StatusBadge,
} from "@/components/panel/ui";
import { db } from "@/db";
import { drivers, trucks } from "@/db/schema";
import { driverAdvanceJob, operatorDeclineJob } from "@/lib/actions/jobs";
import { requireDriver } from "@/lib/auth";
import {
  DRIVER_JOB_STATUS_LABELS,
  formatClp,
  formatDate,
  jobStatusTone,
} from "@/lib/format";
import {
  assertDriverOwnsJob,
  formatVolume,
  getJobOperationalDetail,
  isReadyForEnCamino,
  mapsUrl,
  operatorFacingAmounts,
  operatorSafeNotes,
} from "@/lib/jobs-view";

type Props = { params: Promise<{ id: string }> };

export default async function MisTrabajoDetailPage({ params }: Props) {
  const session = await requireDriver();
  const { id } = await params;
  const operatorId = session.driverId!;

  const owns = await assertDriverOwnsJob(id, operatorId);
  if (!owns) notFound();

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
  const volumeNotes = operatorSafeNotes(job.volumeNotes);
  const jobNotes = operatorSafeNotes(job.notes);

  const volume = formatVolume(job.estimatedM3, job.estimatedItems);
  const when = [formatDate(job.scheduledDate), job.scheduledTime]
    .filter(Boolean)
    .join(" · ");

  const accepted = isReadyForEnCamino(job.assignment);
  const canAccept = job.status === "assigned" && !accepted;
  const statusLabel =
    job.status === "assigned" && accepted
      ? "Listo para salir"
      : (DRIVER_JOB_STATUS_LABELS[job.status] ?? job.status);

  const fleetTrucks = await db
    .select({
      id: trucks.id,
      plate: trucks.plate,
      label: trucks.label,
    })
    .from(trucks)
    .where(and(eq(trucks.operatorId, operatorId), eq(trucks.active, true)))
    .orderBy(asc(trucks.plate));

  const fleetCrew = await db
    .select({ id: drivers.id, name: drivers.name })
    .from(drivers)
    .where(and(eq(drivers.operatorId, operatorId), eq(drivers.active, true)))
    .orderBy(asc(drivers.name));

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <BackLink href="/panel/mis-trabajos" label="Volver a mis trabajos" />
        <PageHeader
          title={job.clientName}
          description={when || "Fecha por confirmar"}
        />
      </div>

      <PanelCard>
        <StatusBadge
          label={statusLabel}
          tone={jobStatusTone(job.status)}
        />

        <div className="mt-4 space-y-4">
          {job.clientPhone ? (
            <a
              href={`tel:${job.clientPhone}`}
              className="flex min-h-14 items-center justify-center rounded-lg bg-ep3-navy px-4 text-base font-semibold text-white"
            >
              Llamar {job.clientPhone}
            </a>
          ) : (
            <p className="text-sm text-ep3-navy/60">Sin teléfono del cliente</p>
          )}

          <div className="grid gap-3">
            <a
              href={mapsUrl(job.originAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-ep3-navy/15 bg-white p-4"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-ep3-navy/55">
                Origen
              </p>
              <p className="mt-1 text-base font-medium text-ep3-navy">
                {job.originAddress}
              </p>
              <p className="mt-2 text-sm font-semibold text-ep3-navy underline">
                Abrir en el mapa
              </p>
            </a>
            <a
              href={mapsUrl(job.destinationAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-ep3-navy/15 bg-white p-4"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-ep3-navy/55">
                Destino
              </p>
              <p className="mt-1 text-base font-medium text-ep3-navy">
                {job.destinationAddress}
              </p>
              <p className="mt-2 text-sm font-semibold text-ep3-navy underline">
                Abrir en el mapa
              </p>
            </a>
          </div>

          <dl className="space-y-3 rounded-lg border border-ep3-navy/10 bg-white/70 p-4 text-sm">
            {accepted ? (
              <>
                <div className="flex justify-between gap-3">
                  <dt className="text-ep3-navy/55">Camión</dt>
                  <dd className="text-right font-medium text-ep3-navy">
                    {job.assignment?.truckPlate}
                    {job.assignment?.truckLabel
                      ? ` · ${job.assignment.truckLabel}`
                      : ""}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ep3-navy/55">Conductor</dt>
                  <dd className="text-right font-medium text-ep3-navy">
                    {job.assignment?.crewDriverName}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ep3-navy/55">RUT chofer</dt>
                  <dd className="text-right font-medium text-ep3-navy">
                    {job.assignment?.crewDriverRut}
                  </dd>
                </div>
              </>
            ) : null}
            {volume ? (
              <div className="flex justify-between gap-3">
                <dt className="text-ep3-navy/55">Carga</dt>
                <dd className="text-right font-medium text-ep3-navy">{volume}</dd>
              </div>
            ) : null}
            {volumeNotes ? (
              <div>
                <dt className="text-ep3-navy/55">Detalle volumen</dt>
                <dd className="mt-1 whitespace-pre-line text-ep3-navy">
                  {volumeNotes}
                </dd>
              </div>
            ) : null}
            {job.assignment?.notes ? (
              <div>
                <dt className="text-ep3-navy/55">Notas para ti</dt>
                <dd className="mt-1 text-ep3-navy">{job.assignment.notes}</dd>
              </div>
            ) : null}
            {jobNotes ? (
              <div>
                <dt className="text-ep3-navy/55">Notas del trabajo</dt>
                <dd className="mt-1 whitespace-pre-line text-ep3-navy">
                  {jobNotes}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </PanelCard>

      <PanelCard>
        <div className="space-y-2">
          {operatorPayout != null ? (
            <div
              className={`rounded-lg border px-4 py-4 ${
                canAccept
                  ? "border-ep3-yellow/60 bg-ep3-yellow/25"
                  : "border-ep3-navy/10 bg-ep3-navy/[0.04]"
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-ep3-navy/60">
                Tu pago por este servicio
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-ep3-navy">
                {formatClp(operatorPayout)}
              </p>
              <p className="mt-1 text-xs text-ep3-navy/55">
                Ya descontado el {marginPercent}% de comisión de la app. No
                incluye el precio que ve el cliente.
              </p>
            </div>
          ) : canAccept ? (
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-900">
              Este trabajo aún no tiene monto de presupuesto. Consulta con
              administración antes de aceptar.
            </p>
          ) : null}

          {canAccept ? (
            <AcceptServiceModal
              jobId={id}
              trucks={fleetTrucks.map((t) => ({
                id: t.id,
                label: t.label ? `${t.plate} — ${t.label}` : t.plate,
              }))}
              crew={fleetCrew.map((c) => ({
                id: c.id,
                label: c.name,
              }))}
            />
          ) : null}

          {job.status === "assigned" && accepted ? (
            <form action={driverAdvanceJob.bind(null, id, "in_progress")}>
              <button
                type="submit"
                className="flex min-h-14 w-full items-center justify-center rounded-lg bg-ep3-yellow text-base font-bold text-ep3-navy"
              >
                En camino
              </button>
              <p className="mt-2 text-center text-xs text-ep3-navy/55">
                Al confirmar se avisa al cliente por correo (simulado).
              </p>
            </form>
          ) : null}

          {canAccept ? (
            <ConfirmActionForm
              action={operatorDeclineJob.bind(null, id)}
              triggerLabel="Rechazar trabajo"
              title="Rechazar trabajo"
              description="El trabajo vuelve a administración para asignarlo a otro operador."
              confirmLabel="Confirmar rechazo"
              triggerClassName="flex min-h-14 w-full items-center justify-center rounded-lg border border-red-300 text-base font-semibold text-red-700"
              confirmClassName="min-h-12 w-full rounded-lg bg-red-700 text-base font-semibold text-white"
            />
          ) : null}

          {job.status === "in_progress" ? (
            <>
              <p className="rounded-lg bg-sky-50 px-4 py-3 text-center text-sm font-medium text-sky-950">
                Aviso al cliente (simulado): se envió correo de que su mudanza
                va en camino
                {job.clientEmail ? ` a ${job.clientEmail}` : " (sin correo)"}.
              </p>
              <form action={driverAdvanceJob.bind(null, id, "completed")}>
                <button
                  type="submit"
                  className="flex min-h-14 w-full items-center justify-center rounded-lg bg-emerald-700 text-base font-bold text-white"
                >
                  Finalizar
                </button>
              </form>
            </>
          ) : null}

          {job.status === "completed" ? (
            <p className="rounded-lg bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-800">
              Trabajo finalizado
            </p>
          ) : null}
          {job.status === "cancelled" ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-800">
              Trabajo cancelado
            </p>
          ) : null}
        </div>
      </PanelCard>
    </div>
  );
}
