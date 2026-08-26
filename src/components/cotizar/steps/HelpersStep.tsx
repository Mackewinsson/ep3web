"use client";

import type { HelpersOption } from "@/lib/quote-wizard-types";
import { HELPERS_LABELS, HELPERS_OPTIONS } from "@/lib/quote-wizard-types";

type Props = {
  value: HelpersOption | "";
  onChange: (next: HelpersOption) => void;
};

export function HelpersStep({ value, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-balance text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
          ¿Cuántos ayudantes necesitas?
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Indica quién baja y sube las cosas en tu mudanza.
        </p>
      </div>
      <div className="space-y-3">
        {HELPERS_OPTIONS.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 py-4 text-left text-base font-medium transition ${
                selected
                  ? "border-ep3-navy bg-ep3-navy/5 text-ep3-navy"
                  : "border-slate-300 text-slate-700 hover:border-slate-400"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                  selected
                    ? "border-ep3-navy bg-ep3-navy text-ep3-yellow"
                    : "border-slate-400"
                }`}
                aria-hidden
              >
                {selected ? "✓" : ""}
              </span>
              <span>{HELPERS_LABELS[opt]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function isHelpersValid(value: HelpersOption | ""): boolean {
  return Boolean(value);
}
