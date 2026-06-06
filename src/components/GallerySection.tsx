import { GalleryGrid } from "@/components/GalleryGrid";
import { getGalleryData } from "@/lib/gallery";
import theme from "@/theme.json";

const { navy, yellow, kraft } = theme.colors;

export function GallerySection() {
  const data = getGalleryData();
  if (!data) return null;

  return (
    <section
      id="galeria"
      className="gallery-section relative scroll-mt-20 overflow-hidden border-y border-slate-200 bg-white px-4 py-10 sm:py-14 md:px-6 md:py-20"
      aria-labelledby="gallery-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              -12deg,
              transparent,
              transparent 28px,
              ${kraft}18 28px,
              ${kraft}18 29px
            )
          `,
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute -right-16 top-8 h-40 w-40 rotate-12 opacity-[0.12] sm:h-56 sm:w-56"
        style={{
          background: `repeating-linear-gradient(
            45deg,
            ${yellow},
            ${yellow} 12px,
            ${navy} 12px,
            ${navy} 24px
          )`,
        }}
        aria-hidden
      />

      <div
        className="absolute left-0 right-0 top-0 h-1"
        style={{
          background: `linear-gradient(90deg, transparent, ${yellow}, transparent)`,
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2
              id="gallery-heading"
              className="text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl"
            >
              {data.headline}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 sm:mt-2 sm:text-base">
              {data.subheadline}
            </p>
          </div>

          <div
            className="hidden flex-shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex"
            aria-hidden
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-extrabold"
              style={{ background: navy, color: yellow }}
            >
              {data.items.length}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Fotos
              </p>
              <p className="text-sm font-bold text-slate-700">Operaciones reales</p>
            </div>
          </div>
        </div>

        <GalleryGrid items={data.items} />
      </div>
    </section>
  );
}
