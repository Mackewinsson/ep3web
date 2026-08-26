"use client";

import { useCallback, useState } from "react";
import {
  useBodyScrollLock,
  useEscapeKey,
} from "@/components/panel/use-overlay";
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
  const close = useCallback(() => setOpen(false), []);

  useBodyScrollLock(open);
  useEscapeKey(open, close);

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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="accept-service-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2
                  id="accept-service-title"
                  className="text-lg font-semibold text-ep3-navy"
                >
                  Aceptar servicio
                </h2>
                <p className="mt-1 text-sm text-ep3-navy/60">
                  Indica chofer, RUT y patente del camión.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar"
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-ep3-navy/70 hover:bg-ep3-navy/5"
              >
                <span className="text-2xl leading-none" aria-hidden>
                  ×
                </span>
              </button>
            </div>

            <form action={action} className="space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ep3-navy">
                  Nombre chofer
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
                  RUT chofer
                </span>
                <input
                  name="crewDriverRut"
                  required
                  placeholder="Ej. 12.345.678-9"
                  autoComplete="off"
                  className="w-full rounded-md border border-ep3-navy/20 bg-white px-3 py-2.5 text-base text-ep3-navy outline-none focus:border-ep3-navy md:text-sm"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ep3-navy">
                  Patente camión
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
