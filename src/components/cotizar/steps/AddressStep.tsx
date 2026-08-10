"use client";

import { ChileAddressAutocomplete } from "@/components/cotizar/ChileAddressAutocomplete";
import type { AddressBlock, PropertyType } from "@/lib/quote-wizard-types";
import { PROPERTY_TYPE_LABELS } from "@/lib/quote-wizard-types";

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-ep3-navy md:text-sm";

type Props = {
  title: string;
  value: AddressBlock;
  onChange: (next: AddressBlock) => void;
  showMapPlaceholder?: boolean;
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
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition ${
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

export function AddressStep({
  title,
  value,
  onChange,
  showMapPlaceholder = false,
}: Props) {
  const isApartment = value.propertyType === "departamento";

  function setPropertyType(propertyType: PropertyType | "") {
    if (propertyType === "departamento") {
      onChange({ ...value, propertyType });
      return;
    }
    onChange({
      ...value,
      propertyType,
      floor: "",
      hasElevator: null,
    });
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h2>

      {showMapPlaceholder ? (
        <div
          className="flex h-44 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-100 text-sm text-slate-500"
          aria-hidden
        >
          Mapa (próximamente)
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-800">Tipo</span>
          <select
            className={fieldClass}
            value={value.propertyType}
            onChange={(e) =>
              setPropertyType(e.target.value as PropertyType | "")
            }
          >
            <option value="">Selecciona</option>
            {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((k) => (
              <option key={k} value={k}>
                {PROPERTY_TYPE_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-800">Dirección</span>
          <ChileAddressAutocomplete
            value={value.address}
            onChange={(address) => onChange({ ...value, address })}
            placeholder="Ej: Morandé 707, Santiago"
          />
        </label>
      </div>

      {isApartment ? (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-800">
            Datos del departamento
          </p>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-800">Piso</span>
            <input
              className={fieldClass}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={value.floor}
              onChange={(e) => {
                const next = e.target.value.replace(/[^\d]/g, "");
                onChange({ ...value, floor: next });
              }}
              placeholder="Ej: 8"
            />
          </label>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-800">
              ¿Hay ascensor?
            </p>
            <div className="flex gap-3">
              <Choice
                label="Sí"
                selected={value.hasElevator === true}
                onClick={() => onChange({ ...value, hasElevator: true })}
              />
              <Choice
                label="No"
                selected={value.hasElevator === false}
                onClick={() => onChange({ ...value, hasElevator: false })}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function isAddressValid(value: AddressBlock): boolean {
  if (!value.propertyType || value.address.trim().length < 5) return false;
  if (value.propertyType === "departamento") {
    return /^\d+$/.test(value.floor.trim()) && value.hasElevator !== null;
  }
  return true;
}

export function formatAddressExtras(value: AddressBlock): string | null {
  if (value.propertyType !== "departamento") return null;
  const floor = value.floor.trim() ? `piso ${value.floor.trim()}` : "piso —";
  const elev =
    value.hasElevator === true
      ? "con ascensor"
      : value.hasElevator === false
        ? "sin ascensor"
        : "ascensor —";
  return `${floor}, ${elev}`;
}
