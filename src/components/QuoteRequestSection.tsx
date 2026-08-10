import Link from "next/link";

export async function QuoteRequestSection({
  initialSlug: _initialSlug,
}: {
  initialSlug?: string;
}) {
  return (
    <section
      id="presupuesto"
      className="scroll-mt-20 mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-16"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Pide tu presupuesto
          </h2>
          <p className="mt-3 text-slate-600">
            Cotiza tu mudanza paso a paso: direcciones, inventario de muebles,
            acceso del camión y datos de contacto.
          </p>
          <Link
            href="/cotizar"
            className="mt-6 inline-flex rounded-full bg-ep3-yellow px-8 py-3.5 text-sm font-bold text-ep3-navy transition hover:brightness-95"
          >
            Cotizar mudanza
          </Link>
        </div>
      </div>
    </section>
  );
}

export function QuoteRequestSectionFallback() {
  return (
    <section
      id="presupuesto"
      className="scroll-mt-20 mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-16"
    >
      <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
    </section>
  );
}
