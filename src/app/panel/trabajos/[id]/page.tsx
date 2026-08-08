import { asc, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  BackLink,
  PageHeader,
  PanelCard,
  SelectField,
  StatusBadge,
  SubmitButton,
  TextArea,
} from "@/components/panel/ui";
import { db } from "@/db";
import {
  clients,
  drivers,
  jobAssignments,
  jobs,
  trucks,
} from "@/db/schema";
import { assignJob, updateJobStatus } from "@/lib/actions/jobs";
import { formatDate, JOB_STATUS_LABELS } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

export default async function TrabajoDetailPage({ params }: Props) {
  const { id } = await params;

  const [job] = await db
    .select({
      id: jobs.id,
      originAddress: jobs.originAddress,
      destinationAddress: jobs.destinationAddress,
      scheduledDate: jobs.scheduledDate,
      status: jobs.status,
      notes: jobs.notes,
      clientName: clients.name,
    })
    .from(jobs)
    .innerJoin(clients, eq(jobs.clientId, clients.id))
    .where(eq(jobs.id, id))
    .limit(1);

  if (!job) notFound();

  const assignments = await db
    .select({
      id: jobAssignments.id,
      assignedAt: jobAssignments.assignedAt,
      emailSentAt: jobAssignments.emailSentAt,
      notes: jobAssignments.notes,
      driverName: drivers.name,
      driverEmail: drivers.email,
      truckPlate: trucks.plate,
      truckLabel: trucks.label,
    })
    .from(jobAssignments)
    .innerJoin(drivers, eq(jobAssignments.driverId, drivers.id))
    .innerJoin(trucks, eq(jobAssignments.truckId, trucks.id))
    .where(eq(jobAssignments.jobId, id))
    .orderBy(desc(jobAssignments.assignedAt));

  const activeDrivers = await db
    .select({ id: drivers.id, name: drivers.name, email: drivers.email })
    .from(drivers)
    .where(eq(drivers.active, true))
    .orderBy(asc(drivers.name));

  const activeTrucks = await db
    .select({ id: trucks.id, plate: trucks.plate, label: trucks.label })
    .from(trucks)
    .where(eq(trucks.active, true))
    .orderBy(asc(trucks.plate));

  const assignAction = assignJob.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <BackLink href="/panel/trabajos" label="Volver a trabajos" />
        <PageHeader
          title={`Trabajo · ${job.clientName}`}
          description={`Programado: ${formatDate(job.scheduledDate)}`}
        />
      </div>

      <PanelCard>
        <div className="mb-3">
          <StatusBadge
            label={JOB_STATUS_LABELS[job.status] ?? job.status}
          />
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ep3-navy/60">Origen</dt>
            <dd className="font-medium text-ep3-navy">{job.originAddress}</dd>
          </div>
          <div>
            <dt className="text-ep3-navy/60">Destino</dt>
            <dd className="font-medium text-ep3-navy">
              {job.destinationAddress}
            </dd>
          </div>
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
                className="rounded-md bg-ep3-navy px-3 py-1.5 text-sm text-white"
              >
                Marcar en curso
              </button>
            </form>
          ) : null}
          {job.status === "in_progress" ? (
            <form action={updateJobStatus.bind(null, id, "completed")}>
              <button
                type="submit"
                className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm text-white"
              >
                Completar
              </button>
            </form>
          ) : null}
          {job.status !== "completed" && job.status !== "cancelled" ? (
            <form action={updateJobStatus.bind(null, id, "cancelled")}>
              <button
                type="submit"
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700"
              >
                Cancelar
              </button>
            </form>
          ) : null}
        </div>
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
                  {a.driverName} · {a.truckPlate}
                  {a.truckLabel ? ` (${a.truckLabel})` : ""}
                </p>
                <p className="text-ep3-navy/70">{a.driverEmail}</p>
                <p className="mt-1 text-xs text-ep3-navy/60">
                  Asignado {formatDate(a.assignedAt)}
                  {a.emailSentAt
                    ? " · Email enviado"
                    : " · Email pendiente (Resend después)"}
                </p>
              </li>
            ))}
          </ul>
        )}

        {job.status === "pending_assignment" || job.status === "assigned" ? (
          activeDrivers.length === 0 || activeTrucks.length === 0 ? (
            <p className="text-sm text-amber-800">
              Necesitas al menos un conductor y un camión activos para asignar.
            </p>
          ) : (
            <form action={assignAction} className="space-y-4 border-t border-ep3-navy/10 pt-4">
              <h3 className="font-medium text-ep3-navy">
                Asignar conductor y camión
              </h3>
              <SelectField
                label="Conductor"
                name="driverId"
                required
                options={activeDrivers.map((d) => ({
                  value: d.id,
                  label: `${d.name} (${d.email})`,
                }))}
              />
              <SelectField
                label="Camión"
                name="truckId"
                required
                options={activeTrucks.map((t) => ({
                  value: t.id,
                  label: t.label ? `${t.plate} — ${t.label}` : t.plate,
                }))}
              />
              <TextArea label="Notas para el conductor" name="notes" />
              <SubmitButton label="Asignar conductor" />
            </form>
          )
        ) : null}
      </PanelCard>
    </div>
  );
}
