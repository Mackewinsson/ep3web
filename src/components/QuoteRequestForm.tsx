"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  submitPublicQuote,
  type PublicQuoteState,
} from "@/lib/actions/public-quote";
import { formatClp, PRICING_UNIT_LABELS } from "@/lib/format";

type PackageOption = {
  id: string;
  name: string;
  slug: string;
  pricingType: "fixed" | "m3" | "unit";
  basePrice: string;
};

const initialState: PublicQuoteState = {};

const fieldClassName =
  "w-full rounded-md border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-ep3-navy md:text-sm";

export function QuoteRequestForm({
  packages,
  initialSlug,
}: {
  packages: PackageOption[];
  initialSlug?: string;
}) {
  const [state, formAction, pending] = useActionState(
    submitPublicQuote,
    initialState,
  );

  const initialPackageId = useMemo(() => {
    if (!initialSlug) return "";
    return packages.find((p) => p.slug === initialSlug)?.id ?? "";
  }, [initialSlug, packages]);

  const [packageId, setPackageId] = useState(initialPackageId);

  useEffect(() => {
    setPackageId(initialPackageId);
  }, [initialPackageId]);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
        <h3 className="text-lg font-semibold">¡Solicitud recibida!</h3>
        <p className="mt-2 text-sm">
          Te contactaremos pronto para confirmar el presupuesto. También puedes
          escribirnos por WhatsApp si es urgente.
        </p>
        <a
          href="https://wa.link/9rr0si"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex text-sm font-semibold underline"
        >
          Abrir WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-1">
          <span className="mb-1 block font-medium text-slate-800">Nombre</span>
          <input
            name="name"
            required
            className={fieldClassName}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-800">Teléfono</span>
          <input
            name="phone"
            required
            className={fieldClassName}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium text-slate-800">
            Correo (opcional)
          </span>
          <input
            name="email"
            type="email"
            className={fieldClassName}
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-800">
          Paquete (opcional)
        </span>
        <select
          name="packageId"
          value={packageId}
          onChange={(e) => setPackageId(e.target.value)}
          className={fieldClassName}
        >
          <option value="">Sin paquete / cotización a medida</option>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {PRICING_UNIT_LABELS[p.pricingType]} ·{" "}
              {formatClp(p.basePrice)}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-800">Origen</span>
          <textarea
            name="originAddress"
            required
            rows={2}
            className={fieldClassName}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-800">Destino</span>
          <textarea
            name="destinationAddress"
            required
            rows={2}
            className={fieldClassName}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-800">
            Fecha preferida
          </span>
          <input
            name="preferredDate"
            type="date"
            className={fieldClassName}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-800">
            m³ estimados
          </span>
          <input
            name="estimatedM3"
            type="number"
            step="0.1"
            min="0"
            className={fieldClassName}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-800">
            Nº elementos
          </span>
          <input
            name="estimatedItems"
            type="number"
            step="1"
            min="0"
            className={fieldClassName}
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-800">
          Notas / detalles
        </span>
        <textarea
          name="volumeNotes"
          rows={3}
          placeholder="Pisos, ascensor, estacionamiento, objetos frágiles…"
          className={fieldClassName}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-ep3-yellow px-6 py-3 text-sm font-bold text-ep3-navy transition hover:brightness-95 disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Enviando…" : "Pedir presupuesto"}
      </button>
    </form>
  );
}
