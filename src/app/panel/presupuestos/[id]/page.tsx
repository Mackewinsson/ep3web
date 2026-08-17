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
    .orderBy(asc(budgetItems.sortOrder), asc(budgetItems.description));

  const inventoryItems = items.filter((i) => i.pricingUnit === "unit");
  const chargeItems = items.filter((i) => i.pricingUnit !== "unit");

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
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {budget.status === "draft" ? (
            <form
              action={setBudgetStatus.bind(null, id, "sent")}
              className="w-full sm:w-auto"
            >
              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-ep3-navy px-3 py-2 text-sm text-white sm:w-auto"
              >
                Marcar enviado
              </button>
            </form>
          ) : null}
          {budget.status === "sent" || budget.status === "draft" ? (
            <>
              <form
                action={setBudgetStatus.bind(null, id, "approved")}
                className="w-full sm:w-auto"
              >
                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-emerald-700 px-3 py-2 text-sm text-white sm:w-auto"
                >
                  Aprobar y crear trabajo
                </button>
              </form>
              <form
                action={setBudgetStatus.bind(null, id, "rejected")}
                className="w-full sm:w-auto"
              >
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

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold text-ep3-navy">
            Inventario del cliente
          </h2>
          <p className="mt-1 text-sm text-ep3-navy/60">
            Cada ítem que eligió en el cotizador. Puedes cambiar cantidad,
            descripción, precio o borrarlo.
          </p>
        </div>

        {inventoryItems.length === 0 ? (
          <PanelCard>
            <p className="text-sm text-ep3-navy/60">
              Sin ítems de inventario aún. Agrégalos abajo (unidad = por
              unidad).
            </p>
          </PanelCard>
        ) : (
          <div className="space-y-3">
            {inventoryItems.map((item) => (
              <BudgetItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold text-ep3-navy">Cargos / precio</h2>
          <p className="mt-1 text-sm text-ep3-navy/60">
            Líneas de m³ o monto fijo (estimación interna y recargos).
          </p>
        </div>

        {chargeItems.length === 0 ? (
          <PanelCard>
            <p className="text-sm text-ep3-navy/60">Sin cargos aún.</p>
          </PanelCard>
        ) : (
          <div className="space-y-3">
            {chargeItems.map((item) => (
              <BudgetItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <PanelCard>
        <h2 className="mb-3 font-semibold text-ep3-navy">Agregar ítem</h2>
        <form action={addItem} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Descripción" name="description" required />
          </div>
          <SelectField
            label="Unidad"
            name="pricingUnit"
            required
            defaultValue="unit"
            options={[
              { value: "unit", label: "Por unidad (inventario)" },
              { value: "m3", label: "Por m³" },
              { value: "fixed", label: "Precio fijo" },
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
            label="Precio unitario"
            name="unitPrice"
            type="number"
            step="1"
            defaultValue={0}
            required
          />
          <div className="sm:col-span-2">
            <SubmitButton label="Agregar ítem" />
          </div>
        </form>
      </PanelCard>
    </div>
  );
}

function BudgetItemCard({
  item,
}: {
  item: {
    id: string;
    description: string;
    pricingUnit: "fixed" | "m3" | "unit";
    quantity: string;
    unitPrice: string;
  };
}) {
  const sub = Number(item.quantity) * Number(item.unitPrice);

  return (
    <PanelCard>
      <form
        action={updateBudgetItem.bind(null, item.id)}
        className="space-y-3"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-ep3-navy/50">
            {PRICING_UNIT_LABELS[item.pricingUnit] ?? item.pricingUnit}
          </p>
          <p className="text-sm font-semibold text-ep3-navy">
            Subtotal: {formatClp(sub)}
          </p>
        </div>

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

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-ep3-navy/55">Unidad</span>
            <select
              name="pricingUnit"
              defaultValue={item.pricingUnit}
              className={inputClassName}
            >
              <option value="unit">{PRICING_UNIT_LABELS.unit}</option>
              <option value="m3">{PRICING_UNIT_LABELS.m3}</option>
              <option value="fixed">{PRICING_UNIT_LABELS.fixed}</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-ep3-navy/55">Cantidad</span>
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
              Precio unitario
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
        </div>

        <div className="flex flex-col gap-2 border-t border-ep3-navy/10 pt-3 sm:flex-row sm:flex-wrap">
          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-ep3-navy px-3 py-2 text-sm text-white sm:w-auto"
          >
            Guardar
          </button>
          <button
            formAction={deleteBudgetItem.bind(null, item.id)}
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 sm:w-auto"
          >
            Quitar
          </button>
        </div>
      </form>
    </PanelCard>
  );
}
