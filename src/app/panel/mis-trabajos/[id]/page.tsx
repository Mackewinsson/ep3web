import { notFound } from "next/navigation";
import {
  BackLink,
  PageHeader,
  PanelCard,
  StatusBadge,
} from "@/components/panel/ui";
import { driverAdvanceJob } from "@/lib/actions/jobs";
import { requireDriver } from "@/lib/auth";
import {
  DRIVER_JOB_STATUS_LABELS,
  formatDate,
  jobStatusTone,
} from "@/lib/format";
import {
  assertDriverOwnsJob,
  formatVolume,
  getJobOperationalDetail,
  mapsUrl,
} from "@/lib/jobs-view";

type Props = { params: Promise<{ id: string }> };

export default async function MisTrabajoDetailPage({ params }: Props) {
  const session = await requireDriver();
  const { id } = await params;

  const owns = await assertDriverOwnsJob(id, session.driverId!);
  if (!owns) notFound();

  const job = await getJobOperationalDetail(id);
  if (!job) notFound();

  const volume = formatVolume(job.estimatedM3, job.estimatedItems);
  const when = [formatDate(job.scheduledDate), job.scheduledTime]
    .filter(Boolean)
    .join(" · ");

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
          label={DRIVER_JOB_STATUS_LABELS[job.status] ?? job.status}
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
                Abrir en Maps
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
                Abrir en Maps
              </p>
            </a>
          </div>

          <dl className="space-y-3 rounded-lg border border-ep3-navy/10 bg-white/70 p-4 text-sm">
            {job.assignment ? (
              <div className="flex justify-between gap-3">
                <dt className="text-ep3-navy/55">Camión</dt>
                <dd className="text-right font-medium text-ep3-navy">
                  {job.assignment.truckPlate}
                  {job.assignment.truckLabel
                    ? ` · ${job.assignment.truckLabel}`
                    : ""}
                </dd>
              </div>
            ) : null}
            {volume ? (
              <div className="flex justify-between gap-3">
                <dt className="text-ep3-navy/55">Carga</dt>
                <dd className="text-right font-medium text-ep3-navy">{volume}</dd>
              </div>
            ) : null}
            {job.volumeNotes ? (
              <div>
                <dt className="text-ep3-navy/55">Detalle volumen</dt>
                <dd className="mt-1 text-ep3-navy">{job.volumeNotes}</dd>
              </div>
            ) : null}
            {job.assignment?.notes ? (
              <div>
                <dt className="text-ep3-navy/55">Notas para ti</dt>
                <dd className="mt-1 text-ep3-navy">{job.assignment.notes}</dd>
              </div>
            ) : null}
            {job.notes ? (
              <div>
                <dt className="text-ep3-navy/55">Notas del trabajo</dt>
                <dd className="mt-1 text-ep3-navy">{job.notes}</dd>
              </div>
            ) : null}
          </dl>

          <div className="space-y-2 pt-2">
            {job.status === "assigned" ? (
              <form action={driverAdvanceJob.bind(null, id, "in_progress")}>
                <button
                  type="submit"
                  className="flex min-h-14 w-full items-center justify-center rounded-lg bg-ep3-yellow text-base font-bold text-ep3-navy"
                >
                  En camino
                </button>
              </form>
            ) : null}
            {job.status === "in_progress" ? (
              <form action={driverAdvanceJob.bind(null, id, "completed")}>
                <button
                  type="submit"
                  className="flex min-h-14 w-full items-center justify-center rounded-lg bg-emerald-700 text-base font-bold text-white"
                >
                  Finalizar
                </button>
              </form>
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
        </div>
      </PanelCard>
    </div>
  );
}
