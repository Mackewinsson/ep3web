import { QuoteRequestForm } from "@/components/QuoteRequestForm";
import { getActivePackagesForSelect } from "@/lib/packages";

export async function QuoteRequestSection({
  initialSlug,
}: {
  initialSlug?: string;
}) {
  const packages = await getActivePackagesForSelect();

  return (
    <section
      id="presupuesto"
      className="scroll-mt-20 mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-16"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Pide tu presupuesto
          </h2>
          <p className="mt-3 text-slate-600">
            Completa el formulario y te respondemos con un valor claro: precio
            fijo, por m³ o según cantidad de elementos. El paquete es opcional.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <QuoteRequestForm packages={packages} initialSlug={initialSlug} />
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
      <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
    </section>
  );
}
