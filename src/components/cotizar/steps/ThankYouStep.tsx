"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { submitWizardQuote } from "@/lib/actions/submit-wizard-quote";
import type { QuoteWizardState } from "@/lib/quote-wizard-types";

type Props = {
  state: QuoteWizardState;
  onDone: () => void;
};

export function ThankYouStep({ state, onDone }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

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
      setSent(true);
      onDone();
    });
  }, [state, onDone]);

  if (error) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-bold text-slate-900">
          No pudimos enviar tu solicitud
        </h2>
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
        <p className="text-sm text-slate-600">
          Usa “Empezar de nuevo” arriba o vuelve a intentarlo más tarde.
        </p>
        <a
          href="https://wa.link/9rr0si"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex text-sm font-semibold text-ep3-navy underline"
        >
          Escribir por WhatsApp
        </a>
      </div>
    );
  }

  if (!sent || pending) {
    return (
      <div className="space-y-3 py-8 text-center">
        <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-ep3-navy/15" />
        <h2 className="text-xl font-bold text-slate-900">Enviando tu solicitud…</h2>
        <p className="text-sm text-slate-600">Un momento, por favor.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-8 text-center text-emerald-950 sm:px-8">
      <h2 className="text-balance text-2xl font-bold">¡Gracias!</h2>
      <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-relaxed sm:text-base">
        Recibimos tu solicitud. En breve te enviaremos la cotización a tu
        correo
        {state.contact.email ? (
          <>
            {" "}
            (<strong className="break-all">{state.contact.email}</strong>)
          </>
        ) : null}
        .
      </p>
      <p className="mt-4 text-sm text-emerald-900/80">
        Si necesitas algo urgente, escríbenos por WhatsApp.
      </p>
      <a
        href="https://wa.link/9rr0si"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-ep3-navy px-5 py-2.5 text-sm font-bold text-white hover:brightness-110"
      >
        Escribir por WhatsApp
      </a>
    </div>
  );
}
