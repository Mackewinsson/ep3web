import type { ReactNode } from "react";
import {
  GridCard,
  GridEmptyRow,
  GridSectionRow,
  gridButton,
  gridCell,
  type GridStat,
} from "@/components/panel/data-grid";
import {
  addBudgetItem,
  deleteBudgetItem,
  updateBudgetItem,
} from "@/lib/actions/budgets";
import type { BudgetItemRow } from "@/lib/budget-items-view";
import {
  formatClp,
  formatClpPlusIva,
  pluralizeEs,
  trimDecimals,
} from "@/lib/format";
import { formatM3 } from "@/lib/quote-pricing";

export type { BudgetItemRow };

const COLUMNS = 9;

const UNIT_OPTIONS = [
  { value: "unit", label: "Unidad" },
  { value: "m3", label: "m³" },
  { value: "fixed", label: "Fijo" },
];

function rowFormId(itemId: string) {
  return `budget-item-${itemId}`;
}

/**
 * React keeps the DOM value of an uncontrolled input across re-renders, so a
 * row whose stored values changed server-side (e.g. «Mudanza estimada» after
 * an inventory edit) would keep showing — and re-submit — the old numbers.
 * Keying rows on their contents remounts only the rows that actually changed.
 */
function rowRevision(row: BudgetItemRow) {
  return [
    row.id,
    row.description,
    row.pricingUnit,
    row.quantity,
    row.unitPrice,
    row.resolvedVolumeM3 ?? "",
  ].join("|");
}

function lineVolume(row: BudgetItemRow) {
  const qty = Number(row.quantity);
  if (row.pricingUnit === "m3") return qty;
  if (row.pricingUnit !== "unit" || row.resolvedVolumeM3 == null) return null;
  return row.resolvedVolumeM3 * qty;
}

function ItemRow({
  row,
  index,
  returnTo,
}: {
  row: BudgetItemRow;
  index: number;
  returnTo: string | null;
}) {
  const formId = rowFormId(row.id);
  const qty = Number(row.quantity);
  const subtotal = qty * Number(row.unitPrice);
  const volume = lineVolume(row);
  const isUnit = row.pricingUnit === "unit";

  return (
    <tr className="border-t border-ep3-navy/10 hover:bg-ep3-yellow/[0.07]">
      <td className="px-3 py-1.5 text-right text-xs tabular-nums text-ep3-navy/35">
        {index}
      </td>
      <td className={gridCell.body}>
        <input
          form={formId}
          name="description"
          required
          defaultValue={row.description}
          aria-label="Descripción"
          className={`${gridCell.input} min-w-[14rem] font-medium`}
        />
      </td>
      <td className={gridCell.body}>
        <select
          form={formId}
          name="pricingUnit"
          defaultValue={row.pricingUnit}
          aria-label="Tipo de línea"
          className={`${gridCell.input} min-w-[6.5rem]`}
        >
          {UNIT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </td>
      <td className={gridCell.num}>
        <input
          form={formId}
          name="quantity"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={trimDecimals(row.quantity)}
          aria-label="Cantidad"
          className={`${gridCell.inputNum} w-24`}
        />
      </td>
      <td className={gridCell.num}>
        {isUnit ? (
          <input
            form={formId}
            name="unitVolumeM3"
            type="number"
            step="0.001"
            min="0"
            defaultValue={row.resolvedVolumeM3 ?? undefined}
            placeholder="—"
            aria-label="m³ por unidad"
            className={`${gridCell.inputNum} w-24`}
          />
        ) : (
          <span className="pr-2 text-ep3-navy/30">—</span>
        )}
      </td>
      <td className={`${gridCell.num} pr-4 font-medium`}>
        {volume != null ? (
          formatM3(volume)
        ) : isUnit ? (
          <span className="text-amber-700">sin m³</span>
        ) : (
          <span className="text-ep3-navy/30">—</span>
        )}
      </td>
      <td className={gridCell.num}>
        <input
          form={formId}
          name="unitPrice"
          type="number"
          step="1"
          min="0"
          required
          defaultValue={trimDecimals(row.unitPrice)}
          aria-label="Precio unitario"
          className={`${gridCell.inputNum} w-32`}
        />
      </td>
      <td
        className={`${gridCell.num} pr-4 font-semibold ${
          subtotal > 0 ? "" : "text-ep3-navy/35"
        }`}
      >
        {formatClp(subtotal)}
      </td>
      <td className="px-3 py-1.5">
        <div className="flex items-center justify-end gap-1.5">
          <button form={formId} type="submit" className={gridButton.ghost}>
            Guardar
          </button>
          <button
            form={formId}
            formAction={deleteBudgetItem.bind(null, row.id, returnTo)}
            type="submit"
            aria-label={`Quitar ${row.description}`}
            title="Quitar ítem"
            className={gridButton.iconDanger}
          >
            ✕
          </button>
        </div>
      </td>
    </tr>
  );
}

/**
 * Spreadsheet-style editor for `budget_items`: one row per line, inline
 * editing, and a blank row to append. Each row posts its own server action.
 */
export function BudgetItemsGrid({
  budgetId,
  items,
  totalAmount,
  billedM3,
  returnTo = null,
  actions,
}: {
  budgetId: string;
  items: BudgetItemRow[];
  totalAmount: string;
  /** m³ charged on `m3` lines, used to flag mismatches with the inventory. */
  billedM3: number | null;
  /** Panel path to land on after saving, so editing never changes screen. */
  returnTo?: string | null;
  actions?: ReactNode;
}) {
  const inventory = items.filter((i) => i.pricingUnit === "unit");
  const charges = items.filter((i) => i.pricingUnit !== "unit");

  const unitCount = inventory.reduce((sum, i) => sum + Number(i.quantity), 0);
  const inventoryM3 = inventory.reduce(
    (sum, i) => sum + (lineVolume(i) ?? 0),
    0,
  );
  const missingVolume = inventory.some((i) => lineVolume(i) == null);
  const mismatch =
    billedM3 != null && Math.abs(billedM3 - inventoryM3) >= 0.05;

  const stats: GridStat[] = [
    {
      label: "Ítems",
      value: String(unitCount),
      hint: `${pluralizeEs(inventory.length, "línea", "líneas")} de inventario`,
    },
    {
      label: "m³ inventario",
      value: `${formatM3(inventoryM3)} m³`,
      hint: missingVolume ? "Hay ítems sin m³" : "Suma de los ítems",
      tone: missingVolume ? "warning" : "default",
    },
    {
      label: "m³ cobrados",
      value: billedM3 == null ? "—" : `${formatM3(billedM3)} m³`,
      hint: mismatch
        ? "No coincide con el inventario"
        : "Línea «Mudanza estimada»",
      tone: mismatch ? "warning" : "default",
    },
    {
      label: "Total cliente",
      value: formatClpPlusIva(totalAmount),
      hint: "IVA no incluido",
    },
  ];

  return (
    <GridCard
      title="Ítems del presupuesto"
      description="Edita cualquier celda y guarda la fila (Enter también guarda). Al cambiar m³ se ajustan «Mudanza estimada» y el precio."
      actions={actions}
      stats={stats}
    >
      <table className="w-full min-w-[60rem] border-collapse text-sm">
        <thead className="bg-ep3-navy/[0.03]">
          <tr>
            <th className={`${gridCell.head} w-10 text-right`}>#</th>
            <th className={`${gridCell.head} text-left`}>Descripción</th>
            <th className={`${gridCell.head} text-left`}>Tipo</th>
            <th className={`${gridCell.head} text-right`}>Cantidad</th>
            <th className={`${gridCell.head} text-right`}>m³ / unidad</th>
            <th className={`${gridCell.head} pr-4 text-right`}>m³ línea</th>
            <th className={`${gridCell.head} text-right`}>Precio unit.</th>
            <th className={`${gridCell.head} pr-4 text-right`}>Subtotal</th>
            <th className={`${gridCell.head} text-right`}>Acciones</th>
          </tr>
        </thead>

        <tbody>
          <GridSectionRow
            label="Inventario del cliente"
            hint="lo que eligió en el cotizador + lo que agregues"
            colSpan={COLUMNS}
          />
          {inventory.length === 0 ? (
            <GridEmptyRow
              colSpan={COLUMNS}
              message="Sin ítems de inventario. Agrégalos en la última fila."
            />
          ) : (
            inventory.map((row, i) => (
              <ItemRow
                key={rowRevision(row)}
                row={row}
                index={i + 1}
                returnTo={returnTo}
              />
            ))
          )}

          <GridSectionRow
            label="Cargos y precio"
            hint="líneas por m³ o monto fijo"
            colSpan={COLUMNS}
          />
          {charges.length === 0 ? (
            <GridEmptyRow colSpan={COLUMNS} message="Sin cargos." />
          ) : (
            charges.map((row, i) => (
              <ItemRow
                key={rowRevision(row)}
                row={row}
                index={inventory.length + i + 1}
                returnTo={returnTo}
              />
            ))
          )}

          <tr
            key={`add-${items.length}`}
            className="border-t border-ep3-navy/10 bg-ep3-yellow/[0.09]"
          >
            <td className="px-3 py-2 text-right text-sm font-semibold text-ep3-navy/40">
              +
            </td>
            <td className={gridCell.body}>
              <input
                form="add-budget-item"
                name="description"
                required
                placeholder="Nuevo ítem…"
                aria-label="Descripción del nuevo ítem"
                className={`${gridCell.input} min-w-[14rem] border-ep3-navy/15 bg-white`}
              />
            </td>
            <td className={gridCell.body}>
              <select
                form="add-budget-item"
                name="pricingUnit"
                defaultValue="unit"
                aria-label="Tipo del nuevo ítem"
                className={`${gridCell.input} min-w-[6.5rem] border-ep3-navy/15 bg-white`}
              >
                {UNIT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </td>
            <td className={gridCell.num}>
              <input
                form="add-budget-item"
                name="quantity"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={1}
                aria-label="Cantidad del nuevo ítem"
                className={`${gridCell.inputNum} w-24 border-ep3-navy/15 bg-white`}
              />
            </td>
            <td className={gridCell.num}>
              <input
                form="add-budget-item"
                name="unitVolumeM3"
                type="number"
                step="0.001"
                min="0"
                placeholder="auto"
                aria-label="m³ por unidad del nuevo ítem"
                className={`${gridCell.inputNum} w-24 border-ep3-navy/15 bg-white`}
              />
            </td>
            <td className={`${gridCell.num} pr-4 text-ep3-navy/30`}>—</td>
            <td className={gridCell.num}>
              <input
                form="add-budget-item"
                name="unitPrice"
                type="number"
                step="1"
                min="0"
                required
                defaultValue={0}
                aria-label="Precio unitario del nuevo ítem"
                className={`${gridCell.inputNum} w-32 border-ep3-navy/15 bg-white`}
              />
            </td>
            <td className={`${gridCell.num} pr-4 text-ep3-navy/35`}>—</td>
            <td className="px-3 py-2">
              <div className="flex justify-end">
                <button
                  form="add-budget-item"
                  type="submit"
                  className={gridButton.accent}
                >
                  Agregar
                </button>
              </div>
            </td>
          </tr>
        </tbody>

        <tfoot>
          <tr className="border-t-2 border-ep3-navy/15 bg-ep3-navy/[0.03]">
            <td colSpan={5} className="px-3 py-2.5 text-sm text-ep3-navy/60">
              {pluralizeEs(items.length, "línea", "líneas")} ·{" "}
              {formatM3(inventoryM3)} m³ de inventario
            </td>
            <td className={`${gridCell.num} pr-4 font-semibold`}>
              {billedM3 == null ? "—" : `${formatM3(billedM3)}`}
            </td>
            <td className="px-3 py-2.5 text-right text-xs uppercase tracking-wider text-ep3-navy/55">
              Total
            </td>
            <td className={`${gridCell.num} pr-4 text-base font-bold`}>
              {formatClp(totalAmount)}
            </td>
            <td className="px-3 py-2.5 text-right text-xs text-ep3-navy/50">
              + IVA
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Row forms live outside the table: <form> cannot be a child of <tbody>. */}
      <div className="hidden">
        <form
          id="add-budget-item"
          action={addBudgetItem.bind(null, budgetId, returnTo)}
        />
        {items.map((item) => (
          <form
            key={item.id}
            id={rowFormId(item.id)}
            action={updateBudgetItem.bind(null, item.id, returnTo)}
          />
        ))}
      </div>
    </GridCard>
  );
}
