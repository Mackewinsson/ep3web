"use client";

type Props = {
  suggested: number;
  onAccept: () => void;
  onDecline: () => void;
};

export function BoxesSuggestModal({ suggested, onAccept, onDecline }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="boxes-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2
          id="boxes-modal-title"
          className="text-center text-xl font-bold text-slate-900"
        >
          ¿Todo listo para cotizar?
        </h2>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Según nuestros cálculos, tu mudanza debería considerar{" "}
          <strong>{suggested} cajas</strong> para embalar ropa, loza, libros,
          etc.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Suena elevado, pero créeme. Las cajas no van 100% llenas porque se
          rompen (y es increíble la cantidad de cosas que uno no recuerda
          tener).
        </p>
        <p className="mt-3 text-sm font-medium text-slate-800">
          ¿Actualizamos la estimación?
        </p>
        <div className="mt-5 border-t border-ep3-navy/20 pt-5">
          <button
            type="button"
            onClick={onAccept}
            className="w-full rounded-lg bg-ep3-navy px-4 py-3 text-sm font-bold uppercase tracking-wide text-ep3-yellow hover:brightness-110"
          >
            Sí, considerar {suggested} cajas
          </button>
          <p className="my-3 text-center text-xs text-slate-400">o</p>
          <button
            type="button"
            onClick={onDecline}
            className="w-full text-sm font-medium text-slate-600 underline hover:text-slate-900"
          >
            No, mantener mi estimación
          </button>
        </div>
      </div>
    </div>
  );
}
