"use client";

import { useState, useTransition } from "react";
import { formatAddressExtras } from "@/components/cotizar/steps/AddressStep";
import {
  flattenCatalogItems,
  formatM3,
  type MovingCatalog,
} from "@/lib/moving-catalog";
import { submitWizardQuote } from "@/lib/actions/submit-wizard-quote";
import {
  buildQuoteEstimate,
  type PricingConfig,
} from "@/lib/quote-pricing";
import type { QuoteWizardState } from "@/lib/quote-wizard-types";
import {
  PARKING_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/quote-wizard-types";
import { formatClp } from "@/lib/format";

type Props = {
  state: QuoteWizardState;
  catalog: MovingCatalog;
  pricing: PricingConfig;
  done: boolean;
  onDone: () => void;
};

export function SummaryStep({
  state,
  catalog,
  pricing,
  done,
  onDone,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const estimate = buildQuoteEstimate({
    quantities: state.quantities,
    items: flattenCatalogItems(catalog),
    packingBoxes: state.packingBoxes,
    config: pricing,
    origin: state.origin,
    destination: state.destination,
  });

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await submitWizardQuote({
        origin: state.origin,
        destination: state.destination,
        quantities: state.quantities,
        packingBoxes: state.packingBoxes,
        hasFragile: state.hasFragile === true,
        fragileNotes: state.fragileNotes,
        parkingOrigin: state.parkingOrigin,
        parkingDestination: state.parkingDestination,
        contact: state.contact,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      onDone();
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-900">
        <h2 className="text-xl font-bold">¡Cotización enviada!</h2>
        <p className="mt-2 text-sm">
          Creamos tu solicitud y un presupuesto estimado en el panel. Te
          contactaremos para confirmar.
        </p>
        <a
          href="https://wa.link/9rr0si"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex text-sm font-semibold underline"
        >
          Escribir por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
        Resumen de tu cotización
      </h2>

      <section className="rounded-xl border border-ep3-navy/20 bg-ep3-navy/5 p-4 text-sm">
        <p className="font-semibold text-ep3-navy">Estimación automática</p>
        <p className="mt-1 text-slate-700">
          {formatM3(estimate.totalM3)} m³ · {estimate.totalItems} ítems
        </p>
        <p className="mt-1 text-lg font-bold text-ep3-navy">
          {formatClp(estimate.totalAmount)}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Valor referencial. El equipo puede ajustarlo al revisar.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <h3 className="font-semibold text-slate-900">Direcciones</h3>
        <p className="mt-2 text-slate-600">
          <strong>Origen:</strong>{" "}
          {state.origin.propertyType
            ? PROPERTY_TYPE_LABELS[state.origin.propertyType]
            : "—"}{" "}
          — {state.origin.address}
          {formatAddressExtras(state.origin)
            ? ` (${formatAddressExtras(state.origin)})`
            : ""}
        </p>
        <p className="mt-1 text-slate-600">
          <strong>Destino:</strong>{" "}
          {state.destination.propertyType
            ? PROPERTY_TYPE_LABELS[state.destination.propertyType]
            : "—"}{" "}
          — {state.destination.address}
          {formatAddressExtras(state.destination)
            ? ` (${formatAddressExtras(state.destination)})`
            : ""}
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <h3 className="font-semibold text-slate-900">Inventario</h3>
        <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-slate-700">
          {estimate.inventoryLines.map((row) => (
            <li key={row.itemId}>
              {row.quantity}× {row.name}{" "}
              <span className="text-slate-400">
                ({formatM3(row.lineVolumeM3)} m³)
              </span>
            </li>
          ))}
          {estimate.packingBoxes > 0 ? (
            <li>
              {estimate.packingBoxes}× {catalog.packingBox.name}{" "}
              <span className="text-slate-400">
                ({formatM3(estimate.boxVolumeM3)} m³)
              </span>
            </li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <p>
          <strong>Delicados:</strong>{" "}
          {state.hasFragile === true
            ? `Sí${state.fragileNotes ? ` — ${state.fragileNotes}` : ""}`
            : "No"}
        </p>
        <p className="mt-1">
          <strong>Estacionamiento origen:</strong>{" "}
          {state.parkingOrigin ? PARKING_LABELS[state.parkingOrigin] : "—"}
        </p>
        <p className="mt-1">
          <strong>Estacionamiento destino:</strong>{" "}
          {state.parkingDestination
            ? PARKING_LABELS[state.parkingDestination]
            : "—"}
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <p>
          <strong>Contacto:</strong> {state.contact.name} · {state.contact.phone}
          {state.contact.email ? ` · ${state.contact.email}` : ""}
        </p>
        {state.contact.preferredDate ? (
          <p className="mt-1">
            <strong>Fecha preferida:</strong> {state.contact.preferredDate}
          </p>
        ) : null}
      </section>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="w-full rounded-lg bg-ep3-yellow px-4 py-3 text-sm font-bold text-ep3-navy hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar cotización"}
      </button>
    </div>
  );
}
