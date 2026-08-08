import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import {
  EmptyState,
  PageHeader,
  PanelCard,
  StatusBadge,
} from "@/components/panel/ui";
import { RecordList } from "@/components/panel/record-list";
import { db } from "@/db";
import { clients, jobs } from "@/db/schema";
import { formatDate, JOB_STATUS_LABELS, jobStatusTone } from "@/lib/format";

const FILTERS = [
  { value: "", label: "Todos" },
  { value: "pending_assignment", label: "Sin conductor" },
  { value: "assigned", label: "Asignado" },
  { value: "in_progress", label: "En camino" },
  { value: "completed", label: "Finalizado" },
  { value: "cancelled", label: "Cancelado" },
] as const;

type JobStatus =
  | "pending_assignment"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

type Props = {
  searchParams: Promise<{ estado?: string }>;
};

export default async function TrabajosPage({ searchParams }: Props) {
  const { estado } = await searchParams;
  const statusFilter =
    (FILTERS.find((f) => f.value && f.value === estado)?.value as
      | JobStatus
      | undefined) ?? null;

  const query = db
    .select({
      id: jobs.id,
      originAddress: jobs.originAddress,
      destinationAddress: jobs.destinationAddress,
      scheduledDate: jobs.scheduledDate,
      status: jobs.status,
      clientName: clients.name,
      clientPhone: clients.phone,
    })
    .from(jobs)
    .innerJoin(clients, eq(jobs.clientId, clients.id));

  const rows = statusFilter
    ? await query
        .where(eq(jobs.status, statusFilter))
        .orderBy(desc(jobs.createdAt))
    : await query.orderBy(desc(jobs.createdAt));

  return (
    <div>
      <PageHeader
        title="Trabajos"
        description="Mudanzas operativas listas para asignar"
      />

      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((filter) => {
          const active = (filter.value || null) === statusFilter;
          const href = filter.value
            ? `/panel/trabajos?estado=${filter.value}`
            : "/panel/trabajos";
          return (
            <Link
              key={filter.value || "all"}
              href={href}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-ep3-navy text-white"
                  : "bg-white text-ep3-navy ring-1 ring-ep3-navy/15 hover:bg-ep3-navy/5"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <PanelCard>
        {rows.length === 0 ? (
          <EmptyState message="No hay trabajos con este filtro." />
        ) : (
          <RecordList
            emptyMessage="No hay trabajos con este filtro."
            items={rows.map((row) => ({
              id: row.id,
              href: `/panel/trabajos/${row.id}`,
              title: row.clientName,
              badge: (
                <StatusBadge
                  label={JOB_STATUS_LABELS[row.status] ?? row.status}
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
                { label: "Fecha", value: formatDate(row.scheduledDate) },
                { label: "Teléfono", value: row.clientPhone ?? "—" },
              ],
            }))}
          />
        )}
      </PanelCard>
    </div>
  );
}
