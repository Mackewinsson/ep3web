import {
  EmptyState,
  PageHeader,
  PanelCard,
  StatusBadge,
} from "@/components/panel/ui";
import { RecordList } from "@/components/panel/record-list";
import { requireDriver } from "@/lib/auth";
import {
  DRIVER_JOB_STATUS_LABELS,
  formatClp,
  formatDate,
  jobStatusTone,
} from "@/lib/format";
import {
  getDriverAssignedJobs,
  getOperatorMarginPercent,
} from "@/lib/jobs-view";
import { operatorPayoutFromClientTotal } from "@/lib/quote-pricing";

export default async function MisTrabajosPage() {
  const session = await requireDriver();
  const rows = await getDriverAssignedJobs(session.driverId!);
  const marginPercent = await getOperatorMarginPercent();

  // Deduplicate by job id keeping latest assignment
  const seen = new Set<string>();
  const unique = rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });

  const active = unique.filter(
    (r) => r.status === "assigned" || r.status === "in_progress",
  );
  const history = unique.filter(
    (r) => r.status !== "assigned" && r.status !== "in_progress",
  );
  const ordered = [...active, ...history];

  return (
    <div>
      <PageHeader
        title="Mis trabajos"
        description="Servicios asignados a tu flota"
      />
      <PanelCard>
        {ordered.length === 0 ? (
          <EmptyState message="Aún no tienes trabajos asignados." />
        ) : (
          <RecordList
            emptyMessage="Aún no tienes trabajos asignados."
            items={ordered.map((row) => ({
              id: row.id,
              href: `/panel/mis-trabajos/${row.id}`,
              title: row.clientName,
              badge: (
                <StatusBadge
                  label={
                    DRIVER_JOB_STATUS_LABELS[row.status] ??
                    row.status
                  }
                  tone={jobStatusTone(row.status)}
                />
              ),
              fields: [
                {
                  label: "Ruta",
                  value: (
                    <span className="line-clamp-2">
                      {row.originAddress} → {row.destinationAddress}
                    </span>
                  ),
                },
                {
                  label: "Cuándo",
                  value: [
                    formatDate(row.scheduledDate),
                    row.scheduledTime,
                  ]
                    .filter(Boolean)
                    .join(" · "),
                },
                {
                  label: "Camión",
                  value: row.truckPlate ?? "Por aceptar",
                },
                {
                  label: "Conductor",
                  value: row.crewDriverName ?? "Por aceptar",
                },
                {
                  label: "Tu pago",
                  value: row.clientTotalAmount
                    ? formatClp(
                        operatorPayoutFromClientTotal(
                          Number(row.clientTotalAmount),
                          marginPercent,
                        ),
                      )
                    : "—",
                },
              ],
            }))}
          />
        )}
      </PanelCard>
    </div>
  );
}
