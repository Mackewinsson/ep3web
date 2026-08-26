"use client";

import { useState } from "react";
import {
  extractAutoEstimateM3,
  formatM3,
  syncAutoEstimateInNotes,
} from "@/lib/quote-pricing";

const inputClassName =
  "w-full rounded-md border border-ep3-navy/20 bg-white px-3 py-2.5 text-base text-ep3-navy outline-none placeholder:text-ep3-navy/45 focus:border-ep3-navy md:text-sm";

export function QuoteVolumeSyncFields({
  initialM3,
  initialItems,
  initialNotes,
  pricePerM3,
}: {
  initialM3?: string | number | null;
  initialItems?: string | number | null;
  initialNotes?: string | null;
  /** Used when notes have no prior amount to scale from. */
  pricePerM3: number;
}) {
  const [m3, setM3] = useState(
    initialM3 != null && initialM3 !== "" ? String(initialM3) : "",
  );
  const [notes, setNotes] = useState(() => {
    const seed = initialNotes ?? "";
    const value = Number(String(initialM3 ?? "").replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) return seed;
    return syncAutoEstimateInNotes(seed, value, { pricePerM3 });
  });

  function applyM3(raw: string) {
    setM3(raw);
    const value = Number(raw.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) return;
    setNotes((prev) =>
      syncAutoEstimateInNotes(prev, value, { pricePerM3 }),
    );
  }

  function applyNotes(raw: string) {
    setNotes(raw);
    const fromNotes = extractAutoEstimateM3(raw);
    if (fromNotes == null) return;
    const current = Number(m3.replace(",", "."));
    if (Number.isFinite(current) && Math.abs(current - fromNotes) < 0.001) {
      return;
    }
    setM3(formatM3(fromNotes));
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ep3-navy">
            m³ estimados
          </span>
          <input
            name="estimatedM3"
            type="number"
            step="0.1"
            min="0"
            value={m3}
            onChange={(e) => applyM3(e.target.value)}
            className={inputClassName}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ep3-navy">
            Nº elementos
          </span>
          <input
            name="estimatedItems"
            type="number"
            step="1"
            min="0"
            defaultValue={initialItems ?? undefined}
            className={inputClassName}
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ep3-navy">
          Volumen / notas
        </span>
        <textarea
          name="volumeNotes"
          rows={10}
          value={notes}
          onChange={(e) => applyNotes(e.target.value)}
          className={inputClassName}
        />
      </label>
    </>
  );
}
