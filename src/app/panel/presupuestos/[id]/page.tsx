import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BudgetItemsGrid } from "@/components/panel/budget-items-grid";
import { ServiceDetailsCard } from "@/components/panel/service-details-card";
import {
  BackLink,
  Field,
  PageHeader,
  PanelCard,
  StatusBadge,
  SubmitButton,
  TextArea,
} from "@/components/panel/ui";
import { db } from "@/db";
import { budgets, clients, jobs, quoteRequests } from "@/db/schema";
import { setBudgetStatus, updateBudgetMeta } from "@/lib/actions/budgets";
import { loadBudgetItemsView } from "@/lib/budget-items-view";
import {
  BUDGET_STATUS_LABELS,
  budgetStatusTone,
  formatClpPlusIva,
  JOB_STATUS_LABELS,
} from "@/lib/format";
import { clientMessageFromNotes } from "@/lib/quote-pricing";

type Props = { params: Promise<{ id: string }> };

const budgetColumns = {
  id: budgets.id,
  title: budgets.title,
  status: budgets.status,
  totalAmount: budgets.totalAmount,
  validUntil: budgets.validUntil,
  notes: budgets.notes,
  quoteRequestId: budgets.quoteRequestId,
  clientName: clients.name,
  /** Wizard snapshot: the only record of access, helpers and fragile items. */
  volumeNotes: quoteRequests.volumeNotes,
};

function loadBudget(id: string) {
  return db
    .select(budgetColumns)
    .from(budgets)
    .innerJoin(clients, eq(budgets.clientId, clients.id))
    .leftJoin(quoteRequests, eq(budgets.quoteRequestId, quoteRequests.id))
    .where(eq(budgets.id, id))
    .limit(1);
}

export default async function PresupuestoDetailPage({ params }: Props) {
  const { id } = await params;

  const [budget] = await loadBudget(id);
  if (!budget) notFound();

  const { rows: gridRows, billedM3, hydrated } = await loadBudgetItemsView(id);
  const [synced] = hydrated ? await loadBudget(id) : [null];
  const row = synced ?? budget;

  const linkedJobs = await db
    .select({ id: jobs.id, status: jobs.status })
    .from(jobs)
    .where(eq(jobs.budgetId, id))
    .orderBy(asc(jobs.createdAt));

  const editable = row.status === "draft" || row.status === "sent";
  // Older budgets still hold the wizard dump here; show only the message part.
  // Saving (or sending) persists the cleaned value.
  const clientMessage = clientMessageFromNotes(row.notes);

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/panel/presupuestos" label="Volver a presupuestos" />
        <PageHeader
          title={row.title}
          description={`Cliente: ${row.clientName}`}
        />
      </div>

      <PanelCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge
              label={BUDGET_STATUS_LABELS[row.status] ?? row.status}
              tone={budgetStatusTone(row.status)}
            />
            <p className="text-lg font-semibold text-ep3-navy">
              {formatClpPlusIva(row.totalAmount)}
            </p>
            <p className="text-sm text-ep3-navy/55">
              El cliente ve este monto + IVA (no incluido).
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {row.status === "draft" ? (
              <form action={setBudgetStatus.bind(null, id, "sent")}>
                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-ep3-navy px-3 py-2 text-sm text-white sm:w-auto"
                >
                  Enviar al cliente
                </button>
              </form>
            ) : null}
            {editable ? (
              <>
                <form action={setBudgetStatus.bind(null, id, "approved")}>
                  <button
                    type="submit"
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-emerald-700 px-3 py-2 text-sm text-white sm:w-auto"
                  >
                    Aprobar y crear trabajo
                  </button>
                </form>
                <form action={setBudgetStatus.bind(null, id, "rejected")}>
                  <button
                    type="submit"
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 sm:w-auto"
                  >
                    Rechazar
                  </button>
                </form>
              </>
            ) : null}
          </div>
        </div>

        {linkedJobs.length > 0 || row.quoteRequestId ? (
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-ep3-navy/10 pt-4 text-sm">
            {row.quoteRequestId ? (
              <li>
                <Link
                  href={`/panel/cotizaciones/${row.quoteRequestId}`}
                  className="font-medium text-ep3-navy underline"
                >
                  Ver cotización
                </Link>
                <span className="text-ep3-navy/60">
                  {" · "}lo que pidió el cliente
                </span>
              </li>
            ) : null}
            {linkedJobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/panel/trabajos/${job.id}`}
                  className="font-medium text-ep3-navy underline"
                >
                  Ver trabajo
                </Link>
                <span className="text-ep3-navy/60">
                  {" · "}
                  {JOB_STATUS_LABELS[job.status] ?? job.status}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </PanelCard>

      <BudgetItemsGrid
        budgetId={id}
        items={gridRows}
        totalAmount={row.totalAmount}
        billedM3={billedM3}
      />

      <ServiceDetailsCard notes={row.volumeNotes} />

      <PanelCard>
        <h2 className="mb-1 font-semibold text-ep3-navy">Datos del presupuesto</h2>
        <p className="mb-4 text-sm text-ep3-navy/60">
          El mensaje se envía al cliente junto con el total. Los ítems y el
          volumen van en la tabla.
        </p>
        <form
          // Saved values can change server-side; remount so the uncontrolled
          // fields do not keep showing the previous text.
          key={`${row.title}|${row.validUntil ?? ""}|${clientMessage}`}
          action={updateBudgetMeta.bind(null, id)}
          className="space-y-4"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <Field
                label="Título"
                name="title"
                required
                defaultValue={row.title}
              />
              <Field
                label="Válido hasta"
                name="validUntil"
                type="date"
                defaultValue={row.validUntil ?? undefined}
              />
            </div>
            <TextArea
              label="Mensaje para el cliente"
              name="notes"
              rows={9}
              placeholder="Ej.: Coordinamos el horario por WhatsApp. El equipo llega con mantas y film."
              defaultValue={clientMessage}
            />
          </div>
          <SubmitButton label="Guardar datos" />
        </form>
      </PanelCard>
    </div>
  );
}
