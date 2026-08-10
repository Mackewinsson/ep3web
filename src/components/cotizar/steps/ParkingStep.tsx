"use client";

import type { ReactNode } from "react";
import type { ParkingOption } from "@/lib/quote-wizard-types";
import { PARKING_LABELS } from "@/lib/quote-wizard-types";

type Props = {
  title: ReactNode;
  value: ParkingOption | "";
  onChange: (next: ParkingOption) => void;
};

const OPTIONS: ParkingOption[] = ["near", "far", "underground"];

export function ParkingStep({ title, value, onChange }: Props) {
  return (
    <div className="space-y-5">
      <h2 className="text-balance text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
        {title}
      </h2>
      <div className="space-y-3">
        {OPTIONS.map((opt) => {
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
                className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                  selected
                    ? "border-ep3-navy bg-ep3-navy text-ep3-yellow"
                    : "border-slate-400"
                }`}
                aria-hidden
              >
                {selected ? "✓" : ""}
              </span>
              {PARKING_LABELS[opt]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function isParkingValid(value: ParkingOption | ""): boolean {
  return Boolean(value);
}
