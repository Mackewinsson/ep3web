import type { ReactNode } from "react";
import {
  GridCard,
  GridEmptyRow,
  gridCell,
  type GridStat,
} from "@/components/panel/data-grid";
import { formatM3, type VolumeBreakdown } from "@/lib/quote-pricing";

const COLUMNS = 5;

/** Read-only item list for a quote: same numbers as the budget, no prices. */
export function QuoteItemsGrid({
  breakdown,
  source,
  actions,
}: {
  breakdown: VolumeBreakdown;
  /** Where the rows come from, so the admin knows what they are editing. */
  source: "budget" | "notes";
  actions?: ReactNode;
}) {
  const { lines, catalogM3, chargedM3, unexplainedM3, totalItems } = breakdown;

  const stats: GridStat[] = [
    {
      label: "Ítems",
      value: String(totalItems),
      hint: `${lines.length} líneas`,
    },
    {
      label: "m³ inventario",
      value: `${formatM3(catalogM3)} m³`,
      hint: "Suma de los ítems",
    },
    {
      label: "m³ cotizados",
      value: chargedM3 == null ? "—" : `${formatM3(chargedM3)} m³`,
      hint: "Volumen del presupuesto",
    },
    {
      label: "Sin desglose",
      value: `${formatM3(unexplainedM3)} m³`,
      hint:
        unexplainedM3 > 0 ? "Ajuste manual o ítem sin m³" : "Todo desglosado",
      tone: unexplainedM3 > 0 ? "warning" : "default",
    },
  ];

  return (
    <GridCard
      title="Ítems de la cotización"
      description={
        source === "budget"
          ? "Reflejan el presupuesto vinculado. Para editarlos, abre el presupuesto."
          : "Leídos del texto de volumen / notas. Al crear el presupuesto quedan editables."
      }
      actions={actions}
      stats={stats}
    >
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        <thead className="bg-ep3-navy/[0.03]">
          <tr>
            <th className={`${gridCell.head} w-10 text-right`}>#</th>
            <th className={`${gridCell.head} text-left`}>Ítem</th>
            <th className={`${gridCell.head} text-right`}>Cantidad</th>
            <th className={`${gridCell.head} text-right`}>m³ / unidad</th>
            <th className={`${gridCell.head} pr-4 text-right`}>m³ línea</th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 ? (
            <GridEmptyRow
              colSpan={COLUMNS}
              message="Sin ítems registrados en esta cotización."
            />
          ) : (
            lines.map((line, i) => (
              <tr
                key={`${line.name}-${i}`}
                className="border-t border-ep3-navy/10 hover:bg-ep3-yellow/[0.07]"
              >
                <td className="px-3 py-2 text-right text-xs tabular-nums text-ep3-navy/35">
                  {i + 1}
                </td>
                <td className={`${gridCell.body} font-medium`}>
                  {line.name}
                  {line.isPackingBox ? (
                    <span className="ml-2 text-xs font-normal text-ep3-navy/45">
                      embalaje
                    </span>
                  ) : null}
                </td>
                <td className={gridCell.num}>{line.quantity}</td>
                <td className={gridCell.num}>
                  {line.unitVolumeM3 == null ? (
                    <span className="text-ep3-navy/30">—</span>
                  ) : (
                    formatM3(line.unitVolumeM3)
                  )}
                </td>
                <td className={`${gridCell.num} pr-4 font-semibold`}>
                  {line.lineVolumeM3 == null ? (
                    <span className="text-amber-700">sin m³</span>
                  ) : (
                    formatM3(line.lineVolumeM3)
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-ep3-navy/15 bg-ep3-navy/[0.03]">
            <td colSpan={4} className="px-3 py-2.5 text-right text-xs uppercase tracking-wider text-ep3-navy/55">
              Total m³
            </td>
            <td className={`${gridCell.num} pr-4 text-base font-bold`}>
              {chargedM3 == null ? formatM3(catalogM3) : formatM3(chargedM3)}
            </td>
          </tr>
        </tfoot>
      </table>
    </GridCard>
  );
}
