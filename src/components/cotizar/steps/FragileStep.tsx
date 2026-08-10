"use client";

type Props = {
  value: boolean | null;
  notes: string;
  onChange: (hasFragile: boolean, notes: string) => void;
};

function Choice({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left text-base font-medium transition ${
        selected
          ? "border-ep3-navy bg-ep3-navy/5 text-ep3-navy"
          : "border-slate-300 text-slate-700 hover:border-slate-400"
      }`}
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
          selected
            ? "border-ep3-navy bg-ep3-navy text-ep3-yellow"
            : "border-slate-400"
        }`}
        aria-hidden
      >
        {selected ? "✓" : ""}
      </span>
      {label}
    </button>
  );
}

export function FragileStep({ value, notes, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
          ¿Algún mueble <em className="underline">muy</em> delicado con el que
          tengamos que tener más cuidado aún?
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          (por ejemplo, de cristal o vidrio grueso)
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Choice
          label="Sí"
          selected={value === true}
          onClick={() => onChange(true, notes)}
        />
        <Choice
          label="No"
          selected={value === false}
          onClick={() => onChange(false, "")}
        />
      </div>

      {value === true ? (
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-800">
            Cuéntanos cuáles (opcional)
          </span>
          <textarea
            className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-ep3-navy"
            rows={3}
            value={notes}
            onChange={(e) => onChange(true, e.target.value)}
            placeholder="Ej: vitrina de cristal, mesa de centro de vidrio…"
          />
        </label>
      ) : null}
    </div>
  );
}

export function isFragileValid(value: boolean | null): boolean {
  return value !== null;
}
