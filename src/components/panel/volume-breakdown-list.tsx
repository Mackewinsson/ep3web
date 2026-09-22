import { formatM3, type VolumeBreakdown } from "@/lib/quote-pricing";

function formatQuantity(value: number) {
  return Number.isInteger(value) ? String(value) : formatM3(value);
}

/** Item-by-item m³ table. Never renders prices (shared with operators). */
export function VolumeBreakdownList({
  breakdown,
  emptyMessage = "Sin ítems de inventario.",
  overChargedLineHint,
}: {
  breakdown: VolumeBreakdown;
  emptyMessage?: string;
  /** Shown when catalog items add up to more m³ than the billed total. */
  overChargedLineHint?: string;
}) {
  const { lines, catalogM3, chargedM3, unexplainedM3, totalItems } = breakdown;

  if (lines.length === 0 && chargedM3 == null) {
    return <p className="text-sm text-ep3-navy/60">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3 text-sm">
      {lines.length > 0 ? (
        <ul className="divide-y divide-ep3-navy/10 rounded-lg border border-ep3-navy/10 bg-white">
          {lines.map((line, index) => (
            <li
              key={`${line.name}-${index}`}
              className="flex items-start justify-between gap-3 px-3 py-2"
            >
              <span className="text-ep3-navy">
                <span className="font-semibold tabular-nums">
                  {formatQuantity(line.quantity)}×
                </span>{" "}
                {line.name}
              </span>
              <span className="shrink-0 text-right tabular-nums text-ep3-navy/70">
                {line.lineVolumeM3 == null ? (
                  <span className="text-amber-700">sin m³ en catálogo</span>
                ) : (
                  <>
                    {formatM3(line.lineVolumeM3)} m³
                    <span className="block text-xs text-ep3-navy/45">
                      {formatM3(line.unitVolumeM3 ?? 0)} m³ c/u
                    </span>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <dl className="space-y-1 rounded-lg bg-ep3-navy/[0.04] px-3 py-2">
        <div className="flex justify-between gap-3">
          <dt className="text-ep3-navy/60">Ítems ({totalItems})</dt>
          <dd className="tabular-nums text-ep3-navy">{formatM3(catalogM3)} m³</dd>
        </div>
        {unexplainedM3 > 0 ? (
          <div className="flex justify-between gap-3">
            <dt className="text-ep3-navy/60">Otros / ajuste manual</dt>
            <dd className="tabular-nums text-ep3-navy">
              {formatM3(unexplainedM3)} m³
            </dd>
          </div>
        ) : null}
        {chargedM3 != null ? (
          <div className="flex justify-between gap-3 border-t border-ep3-navy/10 pt-1 font-semibold">
            <dt className="text-ep3-navy">Total m³</dt>
            <dd className="tabular-nums text-ep3-navy">{formatM3(chargedM3)} m³</dd>
          </div>
        ) : null}
      </dl>
      {overChargedLineHint && chargedM3 != null && catalogM3 > chargedM3 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
          {overChargedLineHint}
        </p>
      ) : null}
    </div>
  );
}
