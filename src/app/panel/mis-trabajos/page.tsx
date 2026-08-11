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
  formatDate,
  jobStatusTone,
} from "@/lib/format";
import { getDriverAssignedJobs } from "@/lib/jobs-view";

export default async function MisTrabajosPage() {
  const session = await requireDriver();
  const rows = await getDriverAssignedJobs(session.driverId!);

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
        description="Mudanzas y fletes asignados a ti"
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
                  value: row.truckPlate ?? "Por elegir",
                },
              ],
            }))}
          />
        )}
      </PanelCard>
    </div>
  );
}
