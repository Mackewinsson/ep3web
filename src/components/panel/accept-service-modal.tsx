"use client";

import { useState } from "react";
import { operatorAcceptJob } from "@/lib/actions/jobs";

type Option = { id: string; label: string };

export function AcceptServiceModal({
  jobId,
  trucks,
  crew,
}: {
  jobId: string;
  trucks: Option[];
  crew: Option[];
}) {
  const [open, setOpen] = useState(false);
  const action = operatorAcceptJob.bind(null, jobId);

  if (trucks.length === 0 || crew.length === 0) {
    return (
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-900">
        {trucks.length === 0 && crew.length === 0
          ? "Tu flota no tiene camiones ni conductores. Avisa a administración."
          : trucks.length === 0
            ? "No tienes camiones en tu flota. Avisa a administración."
            : "No tienes conductores de flota. Avisa a administración."}
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-14 w-full items-center justify-center rounded-lg bg-ep3-yellow text-base font-bold text-ep3-navy"
      >
        Aceptar servicio
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="accept-service-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2
                  id="accept-service-title"
                  className="text-lg font-semibold text-ep3-navy"
                >
                  Aceptar servicio
                </h2>
                <p className="mt-1 text-sm text-ep3-navy/60">
                  Elige camión, conductor y completa el salvoconducto.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-sm text-ep3-navy/70 hover:bg-ep3-navy/5"
              >
                Cerrar
              </button>
            </div>

            <form action={action} className="space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ep3-navy">
                  Camión (patente)
                </span>
                <select
                  name="truckId"
                  required
                  defaultValue=""
                  className="w-full rounded-md border border-ep3-navy/20 bg-white px-3 py-2.5 text-base text-ep3-navy outline-none focus:border-ep3-navy md:text-sm"
                >
                  <option value="" disabled>
                    Seleccionar…
                  </option>
                  {trucks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ep3-navy">
                  Conductor
                </span>
                <select
                  name="crewDriverId"
                  required
                  defaultValue=""
                  className="w-full rounded-md border border-ep3-navy/20 bg-white px-3 py-2.5 text-base text-ep3-navy outline-none focus:border-ep3-navy md:text-sm"
                >
                  <option value="" disabled>
                    Seleccionar…
                  </option>
                  {crew.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ep3-navy">
                  Número / folio salvoconducto
                </span>
                <input
                  name="folio"
                  required
                  placeholder="Ej. SC-12345"
                  className="w-full rounded-md border border-ep3-navy/20 bg-white px-3 py-2.5 text-base text-ep3-navy outline-none focus:border-ep3-navy md:text-sm"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ep3-navy">
                  Fecha del documento
                </span>
                <input
                  name="issuedAt"
                  type="date"
                  required
                  className="w-full rounded-md border border-ep3-navy/20 bg-white px-3 py-2.5 text-base text-ep3-navy outline-none focus:border-ep3-navy md:text-sm"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ep3-navy">
                  Comuna origen
                </span>
                <input
                  name="originCommune"
                  required
                  className="w-full rounded-md border border-ep3-navy/20 bg-white px-3 py-2.5 text-base text-ep3-navy outline-none focus:border-ep3-navy md:text-sm"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ep3-navy">
                  Comuna destino
                </span>
                <input
                  name="destinationCommune"
                  required
                  className="w-full rounded-md border border-ep3-navy/20 bg-white px-3 py-2.5 text-base text-ep3-navy outline-none focus:border-ep3-navy md:text-sm"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ep3-navy">
                  Notas (opcional)
                </span>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full rounded-md border border-ep3-navy/20 bg-white px-3 py-2.5 text-base text-ep3-navy outline-none focus:border-ep3-navy md:text-sm"
                />
              </label>

              <button
                type="submit"
                className="flex min-h-12 w-full items-center justify-center rounded-lg bg-ep3-navy text-base font-semibold text-white"
              >
                Confirmar aceptación
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
