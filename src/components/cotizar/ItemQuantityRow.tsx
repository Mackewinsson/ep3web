"use client";

type Props = {
  name: string;
  quantity: number;
  onChange: (next: number) => void;
};

export function ItemQuantityRow({ name, quantity, onChange }: Props) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 odd:bg-slate-50 even:bg-white">
      <span className="text-sm text-slate-800">{name}</span>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label={`Quitar ${name}`}
          className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
          onClick={() => onChange(Math.max(0, quantity - 1))}
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-semibold tabular-nums">
          {quantity}
        </span>
        <button
          type="button"
          aria-label={`Agregar ${name}`}
          className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-ep3-navy text-sm font-bold text-ep3-yellow hover:brightness-110"
          onClick={() => onChange(quantity + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}
