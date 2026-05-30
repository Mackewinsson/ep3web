import { getPartnerBrands, type Partner } from "@/lib/partner-brands";
import theme from "@/theme.json";

const { navy, yellow } = theme.colors;

function PartnerTile({ partner }: { partner: Partner }) {
  const initials = partner.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="group relative flex h-20 w-44 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:h-24 sm:w-48 sm:px-4 md:h-28 md:w-52"
      aria-label={partner.name}
    >
      {partner.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={partner.logoUrl}
          alt={partner.name}
          className="max-h-14 max-w-[9.5rem] object-contain sm:max-h-16 sm:max-w-[10.5rem] md:max-h-[4.5rem] md:max-w-[11.5rem]"
        />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white sm:h-11 sm:w-11 sm:text-sm"
            style={{ background: navy }}
            aria-hidden
          >
            {initials}
          </div>
          <span className="max-w-[8.5rem] truncate text-[11px] font-medium text-slate-500 sm:max-w-[9.5rem] sm:text-xs">
            {partner.name}
          </span>
        </div>
      )}
      <span
        className="pointer-events-none absolute bottom-0 left-2 right-2 h-0.5 scale-x-0 rounded-full transition group-hover:scale-x-100"
        style={{ background: yellow }}
        aria-hidden
      />
    </div>
  );
}

function MarqueeTrack({ partners, duplicate }: { partners: Partner[]; duplicate?: boolean }) {
  return (
    <div
      className="flex shrink-0 items-center gap-5 sm:gap-7 md:gap-8"
      aria-hidden={duplicate}
    >
      {partners.map((partner, i) => (
        <PartnerTile key={`${partner.name}-${duplicate ? "dup" : "orig"}-${i}`} partner={partner} />
      ))}
    </div>
  );
}

export function PartnerBrandsSection() {
  const data = getPartnerBrands();
  if (!data) return null;

  const partnerNames = data.partners.map((p) => p.name).join(", ");

  return (
    <section
      className="relative overflow-hidden border-y border-slate-200 bg-white py-12 sm:py-14"
      aria-labelledby="partner-brands-heading"
    >
      <div
        className="absolute left-0 right-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${yellow}, transparent)` }}
        aria-hidden
      />

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-8 text-center">
          <h2
            id="partner-brands-heading"
            className="text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl"
          >
            {data.headline}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 sm:text-base">
            {data.subheadline}
          </p>
          <p className="sr-only">Trabajamos con {partnerNames}.</p>
        </div>
      </div>

      <div
        className="partner-marquee relative mx-auto max-w-6xl overflow-hidden px-4 motion-reduce:hidden md:px-6"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
        }}
      >
        <div className="partner-marquee-track flex w-max gap-5 hover:[animation-play-state:paused] sm:gap-7 md:gap-8">
          <MarqueeTrack partners={data.partners} />
          <MarqueeTrack partners={data.partners} duplicate />
        </div>
      </div>

      <div className="mx-auto hidden max-w-6xl flex-wrap justify-center gap-5 px-4 motion-reduce:flex sm:gap-7 md:gap-8 md:px-6">
        {data.partners.map((partner) => (
          <PartnerTile key={partner.name} partner={partner} />
        ))}
      </div>
    </section>
  );
}
