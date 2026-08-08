import Link from "next/link";
import { formatClp, PRICING_UNIT_LABELS } from "@/lib/format";
import type { HomePackage } from "@/lib/packages";
import { getHomePackages } from "@/lib/packages";

function PackageCard({ pkg }: { pkg: HomePackage }) {
  const highlights = (pkg.highlights ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 4);

  const priceHint =
    pkg.pricingType === "fixed"
      ? formatClp(pkg.basePrice)
      : pkg.pricingType === "m3"
        ? `${formatClp(pkg.basePrice)} / m³`
        : `${formatClp(pkg.basePrice)} / unidad`;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-ep3-kraft">
        {PRICING_UNIT_LABELS[pkg.pricingType] ?? pkg.pricingType}
      </p>
      <h3 className="mt-2 text-xl font-bold text-slate-900">{pkg.name}</h3>
      {pkg.shortDescription ? (
        <p className="mt-2 text-sm text-slate-600">{pkg.shortDescription}</p>
      ) : null}
      <p className="mt-4 text-2xl font-extrabold text-ep3-navy">{priceHint}</p>
      {highlights.length > 0 ? (
        <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
          {highlights.map((h) => (
            <li key={h} className="flex gap-2">
              <span className="text-ep3-yellow" aria-hidden>
                •
              </span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-auto pt-6">
        <Link
          href={`/?paquete=${pkg.slug}#presupuesto`}
          className="inline-flex w-full items-center justify-center rounded-full bg-ep3-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ep3-navy/90 sm:w-auto"
        >
          Pedir este paquete
        </Link>
      </div>
    </article>
  );
}

export async function PackagesSection() {
  const packages = await getHomePackages();

  return (
    <section
      id="paquetes"
      className="scroll-mt-20 border-y border-slate-200 bg-slate-50 px-4 py-10 md:px-6 md:py-16"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Paquetes de mudanza
          </h2>
          <p className="mt-3 text-slate-600">
            Elige un paquete o pide una cotización a medida. Precios fijos, por
            m³ o por cantidad de elementos.
          </p>
        </div>
        {packages.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Pronto publicaremos nuestros paquetes. Mientras tanto puedes pedir
            presupuesto más abajo.
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        )}
        <div className="mt-8">
          <a
            href="#presupuesto"
            className="text-sm font-semibold text-ep3-navy underline"
          >
            Ir al formulario de presupuesto
          </a>
        </div>
      </div>
    </section>
  );
}

export function PackagesSectionFallback() {
  return (
    <section
      id="paquetes"
      className="scroll-mt-20 border-y border-slate-200 bg-slate-50 px-4 py-10 md:px-6 md:py-16"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 h-16 max-w-md animate-pulse rounded bg-slate-200" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
