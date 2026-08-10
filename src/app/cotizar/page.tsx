import type { Metadata } from "next";
import { QuoteWizard } from "@/components/cotizar/QuoteWizard";
import { getMovingCatalogForWizard } from "@/lib/moving-catalog-db";
import { catalogDtoToMovingCatalog } from "@/lib/moving-catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cotizar mudanza | Transportes EP3",
  description:
    "Cotiza tu mudanza paso a paso: direcciones, inventario, acceso y contacto.",
};

export default async function CotizarPage() {
  const { catalog, pricing } = await getMovingCatalogForWizard();

  return (
    <div className="min-w-0">
      <div className="mb-5 text-center sm:mb-8">
        <h1 className="text-balance text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Cotiza tu mudanza
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
          Completa los pasos y te armamos una estimación clara según el volumen
          y las condiciones de acceso.
        </p>
      </div>
      <QuoteWizard
        catalog={catalogDtoToMovingCatalog(catalog)}
        pricing={pricing}
      />
    </div>
  );
}
