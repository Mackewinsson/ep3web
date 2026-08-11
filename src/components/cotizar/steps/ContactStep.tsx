"use client";

import type { QuoteWizardState } from "@/lib/quote-wizard-types";

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-ep3-navy md:text-sm";

type Props = {
  value: QuoteWizardState["contact"];
  onChange: (next: QuoteWizardState["contact"]) => void;
};

export function ContactStep({ value, onChange }: Props) {
  return (
    <div className="space-y-5">
      <h2 className="text-balance text-xl font-bold text-slate-900 sm:text-2xl">
        ¿Cómo te contactamos?
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-1">
          <span className="mb-1 block font-medium text-slate-800">Nombre</span>
          <input
            className={fieldClass}
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-800">Teléfono</span>
          <input
            className={fieldClass}
            value={value.phone}
            onChange={(e) => onChange({ ...value, phone: e.target.value })}
            required
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium text-slate-800">
            Correo
          </span>
          <input
            type="email"
            className={fieldClass}
            value={value.email}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
            required
            placeholder="Para enviarte la cotización"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-800">
            Fecha preferida
          </span>
          <input
            type="date"
            className={fieldClass}
            value={value.preferredDate}
            onChange={(e) =>
              onChange({ ...value, preferredDate: e.target.value })
            }
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-800">
            Hora preferida
          </span>
          <input
            type="time"
            className={fieldClass}
            value={value.preferredTime}
            onChange={(e) =>
              onChange({ ...value, preferredTime: e.target.value })
            }
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium text-slate-800">
            Notas (opcional)
          </span>
          <textarea
            className={fieldClass}
            rows={3}
            value={value.notes}
            onChange={(e) => onChange({ ...value, notes: e.target.value })}
            placeholder="Pisos, ascensor, acceso, etc."
          />
        </label>
      </div>
    </div>
  );
}

export function isContactValid(value: QuoteWizardState["contact"]): boolean {
  return (
    value.name.trim().length >= 2 &&
    value.phone.trim().length >= 8 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())
  );
}
