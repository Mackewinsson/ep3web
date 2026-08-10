"use client";

type Props = {
  name: string;
  quantity: number;
  onChange: (next: number) => void;
};

export function ItemQuantityRow({ name, quantity, onChange }: Props) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 odd:bg-slate-50 even:bg-white">
      <span className="min-w-0 flex-1 text-sm leading-snug text-slate-800">
        {name}
      </span>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          aria-label={`Quitar ${name}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-lg text-slate-700 active:bg-slate-100 sm:h-8 sm:w-8 sm:text-base"
          onClick={() => onChange(Math.max(0, quantity - 1))}
        >
          −
        </button>
        <span className="w-7 text-center text-sm font-semibold tabular-nums">
          {quantity}
        </span>
        <button
          type="button"
          aria-label={`Agregar ${name}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-ep3-navy text-lg font-bold text-ep3-yellow active:brightness-110 sm:h-8 sm:w-8 sm:text-sm"
          onClick={() => onChange(quantity + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}
