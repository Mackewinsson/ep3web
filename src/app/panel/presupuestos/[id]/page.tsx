import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  DataTable,
  Field,
  PageHeader,
  PanelCard,
  StatusBadge,
  SubmitButton,
  TextArea,
} from "@/components/panel/ui";
import { db } from "@/db";
import { budgetItems, budgets, clients } from "@/db/schema";
import {
  addBudgetItem,
  setBudgetStatus,
  updateBudgetMeta,
} from "@/lib/actions/budgets";
import { BUDGET_STATUS_LABELS, formatClp } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

export default async function PresupuestoDetailPage({ params }: Props) {
  const { id } = await params;

  const [budget] = await db
    .select({
      id: budgets.id,
      title: budgets.title,
      status: budgets.status,
      totalAmount: budgets.totalAmount,
      validUntil: budgets.validUntil,
      notes: budgets.notes,
      clientName: clients.name,
    })
    .from(budgets)
    .innerJoin(clients, eq(budgets.clientId, clients.id))
    .where(eq(budgets.id, id))
    .limit(1);

  if (!budget) notFound();

  const items = await db
    .select()
    .from(budgetItems)
    .where(eq(budgetItems.budgetId, id))
    .orderBy(asc(budgetItems.sortOrder));

  const updateMeta = updateBudgetMeta.bind(null, id);
  const addItem = addBudgetItem.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={budget.title}
        description={`Cliente: ${budget.clientName}`}
      />

      <PanelCard>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <StatusBadge
            label={BUDGET_STATUS_LABELS[budget.status] ?? budget.status}
          />
          <p className="text-lg font-semibold text-ep3-navy">
            Total: {formatClp(budget.totalAmount)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {budget.status === "draft" ? (
            <form action={setBudgetStatus.bind(null, id, "sent")}>
              <button
                type="submit"
                className="rounded-md bg-ep3-navy px-3 py-1.5 text-sm text-white"
              >
                Marcar enviado
              </button>
            </form>
          ) : null}
          {budget.status === "sent" || budget.status === "draft" ? (
            <>
              <form action={setBudgetStatus.bind(null, id, "approved")}>
                <button
                  type="submit"
                  className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm text-white"
                >
                  Aprobar y crear trabajo
                </button>
              </form>
              <form action={setBudgetStatus.bind(null, id, "rejected")}>
                <button
                  type="submit"
                  className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700"
                >
                  Rechazar
                </button>
              </form>
            </>
          ) : null}
        </div>
      </PanelCard>

      <PanelCard>
        <h2 className="mb-3 font-semibold text-ep3-navy">Datos</h2>
        <form action={updateMeta} className="space-y-4">
          <Field label="Título" name="title" required defaultValue={budget.title} />
          <Field
            label="Válido hasta"
            name="validUntil"
            type="date"
            defaultValue={budget.validUntil ?? undefined}
          />
          <TextArea label="Notas" name="notes" defaultValue={budget.notes} />
          <SubmitButton label="Guardar datos" />
        </form>
      </PanelCard>

      <PanelCard>
        <h2 className="mb-3 font-semibold text-ep3-navy">Ítems</h2>
        {items.length === 0 ? (
          <p className="mb-4 text-sm text-ep3-navy/60">Sin ítems aún.</p>
        ) : (
          <DataTable headers={["Descripción", "Cant.", "P. unitario", "Subtotal"]}>
            {items.map((item) => {
              const sub =
                Number(item.quantity) * Number(item.unitPrice);
              return (
                <tr key={item.id} className="border-b border-ep3-navy/5">
                  <td className="px-3 py-2">{item.description}</td>
                  <td className="px-3 py-2">{item.quantity}</td>
                  <td className="px-3 py-2">{formatClp(item.unitPrice)}</td>
                  <td className="px-3 py-2">{formatClp(sub)}</td>
                </tr>
              );
            })}
          </DataTable>
        )}

        <form action={addItem} className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <Field label="Descripción" name="description" required />
          </div>
          <Field
            label="Cantidad"
            name="quantity"
            type="number"
            step="0.01"
            defaultValue={1}
            required
          />
          <Field
            label="Precio unitario"
            name="unitPrice"
            type="number"
            step="1"
            required
          />
          <div className="sm:col-span-4">
            <SubmitButton label="Agregar ítem" />
          </div>
        </form>
      </PanelCard>
    </div>
  );
}
