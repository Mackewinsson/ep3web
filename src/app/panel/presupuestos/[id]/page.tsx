import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  BackLink,
  DataTable,
  Field,
  PageHeader,
  PanelCard,
  SelectField,
  StatusBadge,
  SubmitButton,
  TextArea,
} from "@/components/panel/ui";
import { db } from "@/db";
import { budgetItems, budgets, clients } from "@/db/schema";
import {
  addBudgetItem,
  deleteBudgetItem,
  setBudgetStatus,
  updateBudgetItem,
  updateBudgetMeta,
} from "@/lib/actions/budgets";
import {
  BUDGET_STATUS_LABELS,
  budgetStatusTone,
  formatClp,
  PRICING_UNIT_LABELS,
} from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

const inputClassName =
  "w-full rounded-md border border-ep3-navy/20 bg-white px-2 py-2 text-base text-ep3-navy outline-none focus:border-ep3-navy md:text-sm";

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
      <div>
        <BackLink href="/panel/presupuestos" label="Volver a presupuestos" />
        <PageHeader
          title={budget.title}
          description={`Cliente: ${budget.clientName}`}
        />
      </div>

      <PanelCard>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <StatusBadge
            label={BUDGET_STATUS_LABELS[budget.status] ?? budget.status}
            tone={budgetStatusTone(budget.status)}
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
                className="min-h-11 rounded-md bg-ep3-navy px-3 py-2 text-sm text-white"
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
                  className="min-h-11 rounded-md bg-emerald-700 px-3 py-2 text-sm text-white"
                >
                  Aprobar y crear trabajo
                </button>
              </form>
              <form action={setBudgetStatus.bind(null, id, "rejected")}>
                <button
                  type="submit"
                  className="min-h-11 rounded-md border border-red-300 px-3 py-2 text-sm text-red-700"
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
          <DataTable
            headers={[
              "Descripción",
              "Unidad",
              "Cant.",
              "P. unitario",
              "Subtotal",
              "",
            ]}
          >
            {items.map((item) => {
              const sub = Number(item.quantity) * Number(item.unitPrice);
              return (
                <tr key={item.id} className="border-b border-ep3-navy/5 align-top">
                  <td className="px-2 py-3" colSpan={6}>
                    <form
                      action={updateBudgetItem.bind(null, item.id)}
                      className="grid gap-2 lg:grid-cols-[2fr_1fr_0.8fr_1fr_auto_auto] lg:items-end"
                    >
                      <label className="block text-sm">
                        <span className="mb-1 block text-xs text-ep3-navy/55">
                          Descripción
                        </span>
                        <input
                          name="description"
                          required
                          defaultValue={item.description}
                          className={inputClassName}
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="mb-1 block text-xs text-ep3-navy/55">
                          Unidad
                        </span>
                        <select
                          name="pricingUnit"
                          defaultValue={item.pricingUnit}
                          className={inputClassName}
                        >
                          <option value="fixed">
                            {PRICING_UNIT_LABELS.fixed}
                          </option>
                          <option value="m3">{PRICING_UNIT_LABELS.m3}</option>
                          <option value="unit">
                            {PRICING_UNIT_LABELS.unit}
                          </option>
                        </select>
                      </label>
                      <label className="block text-sm">
                        <span className="mb-1 block text-xs text-ep3-navy/55">
                          Cant.
                        </span>
                        <input
                          name="quantity"
                          type="number"
                          step="0.01"
                          required
                          defaultValue={item.quantity}
                          className={inputClassName}
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="mb-1 block text-xs text-ep3-navy/55">
                          Precio
                        </span>
                        <input
                          name="unitPrice"
                          type="number"
                          step="1"
                          required
                          defaultValue={item.unitPrice}
                          className={inputClassName}
                        />
                      </label>
                      <div className="flex flex-col justify-end">
                        <span className="mb-1 text-xs text-ep3-navy/55">
                          Subtotal
                        </span>
                        <span className="py-2 text-sm font-medium text-ep3-navy">
                          {formatClp(sub)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <button
                          type="submit"
                          className="min-h-11 rounded-md bg-ep3-navy px-3 py-2 text-sm text-white"
                        >
                          Guardar
                        </button>
                        <button
                          formAction={deleteBudgetItem.bind(null, item.id)}
                          type="submit"
                          className="min-h-11 rounded-md border border-red-300 px-3 py-2 text-sm text-red-700"
                        >
                          Borrar
                        </button>
                      </div>
                    </form>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}

        <form action={addItem} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-2">
            <Field label="Descripción" name="description" required />
          </div>
          <SelectField
            label="Unidad"
            name="pricingUnit"
            required
            defaultValue="unit"
            options={[
              { value: "fixed", label: "Precio fijo" },
              { value: "m3", label: "Por m³" },
              { value: "unit", label: "Por unidad" },
            ]}
          />
          <Field
            label="Cantidad"
            name="quantity"
            type="number"
            step="0.01"
            defaultValue={1}
            required
          />
          <Field
            label="Precio"
            name="unitPrice"
            type="number"
            step="1"
            required
          />
          <div className="sm:col-span-2 lg:col-span-5">
            <SubmitButton label="Agregar ítem" />
          </div>
        </form>
      </PanelCard>
    </div>
  );
}
