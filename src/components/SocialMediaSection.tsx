import { getSocialLinks, type SocialLink } from "@/lib/social-links";
import theme from "@/theme.json";

const { navy, yellow, kraft } = theme.colors;

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
      />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden>
      <path
        fill="currentColor"
        d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 0012.68 0V8.69a8.18 8.18 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z"
      />
    </svg>
  );
}

function SocialCard({ link }: { link: SocialLink }) {
  const Icon = link.platform === "instagram" ? InstagramIcon : TikTokIcon;
  const accent =
    link.platform === "instagram"
      ? "linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)"
      : navy;

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg sm:p-8"
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md transition group-hover:scale-105"
        style={{ background: accent }}
      >
        <Icon />
      </div>
      <div>
        <p className="text-lg font-bold text-slate-900 sm:text-xl">{link.label}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{link.description}</p>
      </div>
      <span
        className="inline-flex items-center gap-2 text-sm font-semibold transition group-hover:gap-3"
        style={{ color: navy }}
      >
        Visitar perfil
        <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden>
          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
        </svg>
      </span>
    </a>
  );
}

export function SocialMediaSection() {
  const links = getSocialLinks();
  if (!links.length) return null;

  return (
    <section
      id="galeria"
      className="gallery-section relative scroll-mt-20 overflow-hidden border-y border-slate-200 bg-white px-4 py-10 sm:py-14 md:px-6 md:py-20"
      aria-labelledby="social-heading"
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
        <div className="mb-6 max-w-2xl sm:mb-8">
          <h2
            id="social-heading"
            className="text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl"
          >
            Síguenos en redes
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 sm:mt-2 sm:text-base">
            Mira nuestro trabajo en acción en Instagram y TikTok.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          {links.map((link) => (
            <SocialCard key={link.platform} link={link} />
          ))}
        </div>
      </div>
    </section>
  );
}
