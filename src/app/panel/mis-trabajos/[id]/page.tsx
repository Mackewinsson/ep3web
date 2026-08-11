import { asc, eq } from "drizzle-orm";
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
import { trucks } from "@/db/schema";
import {
  driverAdvanceJob,
  driverSaveSalvoConducto,
  driverSelectTruck,
} from "@/lib/actions/jobs";
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
  isReadyForEnCamino,
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

  const activeTrucks = await db
    .select({ id: trucks.id, plate: trucks.plate, label: trucks.label })
    .from(trucks)
    .where(eq(trucks.active, true))
    .orderBy(asc(trucks.plate));

  const truckOptions = [...activeTrucks];
  if (
    job.assignment?.truckId &&
    !truckOptions.some((t) => t.id === job.assignment!.truckId)
  ) {
    truckOptions.unshift({
      id: job.assignment.truckId,
      plate: job.assignment.truckPlate ?? "—",
      label: job.assignment.truckLabel,
    });
  }

  const canPrep = job.status === "assigned";
  const hasTruck = Boolean(job.assignment?.truckId);
  const hasSalvo = Boolean(job.assignment?.salvoConductoCompletedAt);
  const ready = isReadyForEnCamino(job.assignment);

  const selectTruckAction = driverSelectTruck.bind(null, id);
  const saveSalvoAction = driverSaveSalvoConducto.bind(null, id);

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
        </div>
      </PanelCard>

      {canPrep || hasTruck || hasSalvo ? (
        <PanelCard>
          <h2 className="font-semibold text-ep3-navy">Antes de salir</h2>
          <p className="mt-1 text-sm text-ep3-navy/60">
            Elige el camión y registra el salvo conducto para poder marcar En
            camino.
          </p>

          <div className="mt-4 space-y-5">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-ep3-navy">
                1. Camión
              </h3>
              {hasTruck ? (
                <p className="rounded-lg border border-ep3-navy/10 bg-white/70 px-4 py-3 text-sm text-ep3-navy">
                  {job.assignment?.truckPlate}
                  {job.assignment?.truckLabel
                    ? ` · ${job.assignment.truckLabel}`
                    : ""}
                </p>
              ) : null}
              {canPrep ? (
                truckOptions.length === 0 ? (
                  <p className="text-sm text-amber-800">
                    No hay camiones activos. Avisa a administración.
                  </p>
                ) : (
                  <form action={selectTruckAction} className="space-y-3">
                    <SelectField
                      label={hasTruck ? "Cambiar camión" : "Camión a usar"}
                      name="truckId"
                      required
                      defaultValue={job.assignment?.truckId}
                      options={truckOptions.map((t) => ({
                        value: t.id,
                        label: t.label ? `${t.plate} — ${t.label}` : t.plate,
                      }))}
                    />
                    <SubmitButton
                      label={hasTruck ? "Actualizar camión" : "Guardar camión"}
                    />
                  </form>
                )
              ) : null}
            </section>

            <section className="space-y-3 border-t border-ep3-navy/10 pt-4">
              <h3 className="text-sm font-semibold text-ep3-navy">
                2. Salvo conducto
              </h3>
              {hasSalvo ? (
                <dl className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-ep3-navy">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ep3-navy/55">Folio</dt>
                    <dd className="font-medium">
                      {job.assignment?.salvoConductoFolio}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ep3-navy/55">Fecha</dt>
                    <dd className="font-medium">
                      {formatDate(job.assignment?.salvoConductoIssuedAt)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ep3-navy/55">Comuna origen</dt>
                    <dd className="font-medium">
                      {job.assignment?.salvoConductoOriginCommune}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ep3-navy/55">Comuna destino</dt>
                    <dd className="font-medium">
                      {job.assignment?.salvoConductoDestinationCommune}
                    </dd>
                  </div>
                  {job.assignment?.salvoConductoNotes ? (
                    <div>
                      <dt className="text-ep3-navy/55">Notas</dt>
                      <dd className="mt-1">
                        {job.assignment.salvoConductoNotes}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
              {canPrep && hasTruck ? (
                <form action={saveSalvoAction} className="space-y-3">
                  <Field
                    label="Número / folio"
                    name="folio"
                    required
                    defaultValue={job.assignment?.salvoConductoFolio}
                    placeholder="Ej. SC-12345"
                  />
                  <Field
                    label="Fecha del documento"
                    name="issuedAt"
                    type="date"
                    required
                    defaultValue={
                      job.assignment?.salvoConductoIssuedAt ?? undefined
                    }
                  />
                  <Field
                    label="Comuna origen"
                    name="originCommune"
                    required
                    defaultValue={
                      job.assignment?.salvoConductoOriginCommune ?? undefined
                    }
                  />
                  <Field
                    label="Comuna destino"
                    name="destinationCommune"
                    required
                    defaultValue={
                      job.assignment?.salvoConductoDestinationCommune ??
                      undefined
                    }
                  />
                  <TextArea
                    label="Notas (opcional)"
                    name="notes"
                    defaultValue={job.assignment?.salvoConductoNotes}
                  />
                  <SubmitButton
                    label={
                      hasSalvo
                        ? "Actualizar salvo conducto"
                        : "Guardar salvo conducto"
                    }
                  />
                </form>
              ) : null}
              {canPrep && !hasTruck ? (
                <p className="text-sm text-ep3-navy/60">
                  Primero guarda el camión para poder registrar el salvo
                  conducto.
                </p>
              ) : null}
            </section>
          </div>
        </PanelCard>
      ) : null}

      <PanelCard>
        <div className="space-y-2">
          {job.status === "assigned" ? (
            ready ? (
              <form action={driverAdvanceJob.bind(null, id, "in_progress")}>
                <button
                  type="submit"
                  className="flex min-h-14 w-full items-center justify-center rounded-lg bg-ep3-yellow text-base font-bold text-ep3-navy"
                >
                  En camino
                </button>
              </form>
            ) : (
              <p className="rounded-lg bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-900">
                {!hasTruck
                  ? "Elige el camión y completa el salvo conducto para salir."
                  : "Completa el salvo conducto para marcar En camino."}
              </p>
            )
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
      </PanelCard>
    </div>
  );
}
