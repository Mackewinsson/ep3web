"use client";

import { useState } from "react";

type Props = {
  suggested: number;
  onConfirm: (boxes: number) => void;
};

export function BoxesSuggestModal({ suggested, onConfirm }: Props) {
  const [customBoxes, setCustomBoxes] = useState(suggested);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="boxes-modal-title"
    >
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl sm:p-6 sm:pb-6">
        <h2
          id="boxes-modal-title"
          className="text-balance text-center text-xl font-bold text-slate-900"
        >
          ¿Cuántas cajas de embalaje?
        </h2>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Según el volumen de tus muebles, sugerimos{" "}
          <strong>{suggested} cajas</strong> para ropa, loza, libros, etc.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Suena elevado, pero las cajas no van 100% llenas (y suele haber más
          cosas de las que uno recuerda). Puedes aceptar la sugerencia o elegir
          otra cantidad.
        </p>

        <div className="mt-5 border-t border-ep3-navy/20 pt-5">
          <button
            type="button"
            onClick={() => onConfirm(suggested)}
            className="min-h-12 w-full rounded-lg bg-ep3-navy px-4 py-3 text-sm font-bold uppercase tracking-wide text-ep3-yellow hover:brightness-110"
          >
            Sí, considerar {suggested} cajas
          </button>

          <p className="my-4 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
            o elige cuántas
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              aria-label="Quitar una caja"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 text-lg text-slate-700 active:bg-slate-100"
              onClick={() => setCustomBoxes((n) => Math.max(0, n - 1))}
            >
              −
            </button>
            <div className="min-w-[4.5rem] text-center">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={customBoxes}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, "");
                  setCustomBoxes(raw === "" ? 0 : Math.max(0, Number(raw)));
                }}
                className="w-full rounded-md border border-slate-300 px-2 py-2 text-center text-lg font-semibold tabular-nums outline-none focus:border-ep3-navy"
                aria-label="Cantidad de cajas"
              />
              <p className="mt-1 text-xs text-slate-500">cajas</p>
            </div>
            <button
              type="button"
              aria-label="Agregar una caja"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-ep3-navy text-lg font-bold text-ep3-yellow active:brightness-110"
              onClick={() => setCustomBoxes((n) => n + 1)}
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => onConfirm(customBoxes)}
            className="mt-4 min-h-12 w-full rounded-lg border border-ep3-navy px-4 py-3 text-sm font-bold text-ep3-navy hover:bg-ep3-navy/5"
          >
            Continuar con {customBoxes}{" "}
            {customBoxes === 1 ? "caja" : "cajas"}
          </button>

          <button
            type="button"
            onClick={() => onConfirm(0)}
            className="mt-3 min-h-11 w-full text-sm font-medium text-slate-600 underline hover:text-slate-900"
          >
            Sin cajas de embalaje
          </button>
        </div>
      </div>
    </div>
  );
}
