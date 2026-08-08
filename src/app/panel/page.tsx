import { and, asc, count, eq, gte, isNotNull, lt, or } from "drizzle-orm";
import Link from "next/link";
import { PageHeader, PanelCard, StatusBadge } from "@/components/panel/ui";
import { db } from "@/db";
import { budgets, clients, jobs, quoteRequests } from "@/db/schema";
import { formatDate, JOB_STATUS_LABELS, jobStatusTone } from "@/lib/format";

export default async function PanelDashboardPage() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const [
    [openQuotes],
    [awaitingBudgets],
    [needsDriver],
    [enCamino],
    [todayJobs],
    upcomingJobs,
    enCaminoJobs,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(quoteRequests)
      .where(
        or(
          eq(quoteRequests.status, "new"),
          eq(quoteRequests.status, "in_progress"),
        ),
      ),
    db
      .select({ value: count() })
      .from(budgets)
      .where(eq(budgets.status, "sent")),
    db
      .select({ value: count() })
      .from(jobs)
      .where(eq(jobs.status, "pending_assignment")),
    db
      .select({ value: count() })
      .from(jobs)
      .where(eq(jobs.status, "in_progress")),
    db
      .select({ value: count() })
      .from(jobs)
      .where(
        and(
          gte(jobs.scheduledDate, todayStr),
          lt(jobs.scheduledDate, tomorrowStr),
        ),
      ),
    db
      .select({
        id: jobs.id,
        scheduledDate: jobs.scheduledDate,
        scheduledTime: jobs.scheduledTime,
        status: jobs.status,
        originAddress: jobs.originAddress,
        destinationAddress: jobs.destinationAddress,
        clientName: clients.name,
      })
      .from(jobs)
      .innerJoin(clients, eq(jobs.clientId, clients.id))
      .where(
        and(
          isNotNull(jobs.scheduledDate),
          gte(jobs.scheduledDate, todayStr),
          or(
            eq(jobs.status, "pending_assignment"),
            eq(jobs.status, "assigned"),
            eq(jobs.status, "in_progress"),
          ),
        ),
      )
      .orderBy(asc(jobs.scheduledDate))
      .limit(5),
    db
      .select({
        id: jobs.id,
        scheduledDate: jobs.scheduledDate,
        scheduledTime: jobs.scheduledTime,
        originAddress: jobs.originAddress,
        destinationAddress: jobs.destinationAddress,
        clientName: clients.name,
      })
      .from(jobs)
      .innerJoin(clients, eq(jobs.clientId, clients.id))
      .where(eq(jobs.status, "in_progress"))
      .orderBy(asc(jobs.scheduledDate))
      .limit(5),
  ]);

  const cards = [
    {
      label: "Cotizaciones abiertas",
      value: openQuotes.value,
      href: "/panel/cotizaciones",
    },
    {
      label: "Presupuestos enviados",
      value: awaitingBudgets.value,
      href: "/panel/presupuestos",
    },
    {
      label: "Sin conductor",
      value: needsDriver.value,
      href: "/panel/trabajos?estado=pending_assignment",
    },
    {
      label: "En camino ahora",
      value: enCamino.value,
      href: "/panel/trabajos?estado=in_progress",
    },
    {
      label: "Trabajos de hoy",
      value: todayJobs.value,
      href: "/panel/trabajos",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inicio"
        description="Resumen operativo de mudanzas EP3"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="block">
            <PanelCard className="panel-card-interactive h-full">
              <p className="text-sm text-ep3-navy/70">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-ep3-navy">
                {card.value}
              </p>
            </PanelCard>
          </Link>
        ))}
      </div>

      <PanelCard>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-ep3-navy">En camino ahora</h2>
          <Link
            href="/panel/trabajos?estado=in_progress"
            className="text-sm font-medium text-ep3-navy underline"
          >
            Ver todos
          </Link>
        </div>
        {enCaminoJobs.length === 0 ? (
          <p className="text-sm text-ep3-navy/60">
            Ningún trabajo marcado en camino.
          </p>
        ) : (
          <ul className="divide-y divide-ep3-navy/5">
            {enCaminoJobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/panel/trabajos/${job.id}`}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ep3-navy">{job.clientName}</p>
                    <p className="truncate text-sm text-ep3-navy/70">
                      {job.originAddress} → {job.destinationAddress}
                    </p>
                  </div>
                  <span className="text-sm text-ep3-navy/70">
                    {[formatDate(job.scheduledDate), job.scheduledTime]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>

      <PanelCard>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-ep3-navy">Próximos trabajos</h2>
          <Link
            href="/panel/trabajos"
            className="text-sm font-medium text-ep3-navy underline"
          >
            Ver todos
          </Link>
        </div>
        {upcomingJobs.length === 0 ? (
          <p className="text-sm text-ep3-navy/60">
            No hay trabajos programados próximos.
          </p>
        ) : (
          <ul className="divide-y divide-ep3-navy/5">
            {upcomingJobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/panel/trabajos/${job.id}`}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ep3-navy">{job.clientName}</p>
                    <p className="truncate text-sm text-ep3-navy/70">
                      {job.originAddress} → {job.destinationAddress}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm text-ep3-navy/70">
                      {[formatDate(job.scheduledDate), job.scheduledTime]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    <StatusBadge
                      label={JOB_STATUS_LABELS[job.status] ?? job.status}
                      tone={jobStatusTone(job.status)}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
    </div>
  );
}
