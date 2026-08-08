import { and, count, eq, gte, lt, or } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { budgets, jobs, quoteRequests } from "@/db/schema";
import { PageHeader, PanelCard } from "@/components/panel/ui";

export default async function PanelDashboardPage() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const [[openQuotes], [awaitingBudgets], [needsDriver], [todayJobs]] =
    await Promise.all([
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
        .where(
          and(
            gte(jobs.scheduledDate, todayStr),
            lt(jobs.scheduledDate, tomorrowStr),
          ),
        ),
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
      href: "/panel/trabajos",
    },
    {
      label: "Trabajos de hoy",
      value: todayJobs.value,
      href: "/panel/trabajos",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Resumen operativo de mudanzas EP3"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <PanelCard>
              <p className="text-sm text-ep3-navy/70">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-ep3-navy">
                {card.value}
              </p>
            </PanelCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
