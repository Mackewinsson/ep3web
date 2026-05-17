import Image from "next/image";
import theme from "@/theme.json";

const { navy, yellow, kraft } = theme.colors;

const BOXES: {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  rotate: string;
  w: string;
  h: string;
  tied?: boolean;
  tape?: boolean;
}[] = [
  { top: "2%",    left: "4%",  rotate: "-11deg", w: "195px", h: "175px", tied: true             },
  { top: "12%",   left: "44%", rotate:   "7deg", w: "155px", h: "140px",             tape: true },
  { top: "48%",   left: "-1%", rotate:  "-4deg", w: "175px", h: "160px",             tape: true },
  { bottom: "8%", left: "30%", rotate:   "9deg", w: "130px", h: "120px", tied: true             },
  { bottom: "1%", left: "5%",  rotate:  "-7deg", w: "155px", h: "140px",             tape: true },
];

function PackageBox({
  top, bottom, left, right, rotate, w, h, tied, tape,
}: (typeof BOXES)[number]) {
  return (
    <div
      style={{ position: "absolute", top, bottom, left, right, rotate, width: w, height: h }}
      className="drop-shadow-2xl"
    >
      {/* ── main front face ── */}
      <div
        className="absolute inset-0 overflow-hidden rounded-[3px]"
        style={{ background: `linear-gradient(165deg, #dba85e 0%, ${kraft} 40%, #a86a20 100%)` }}
      >
        {/* corrugation: subtle horizontal lines */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,#000 0px,#000 1px,transparent 1px,transparent 9px)",
          }}
        />
        {/* top-lid zone — darker top ~28% */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: "28%",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.10) 100%)",
          }}
        />
        {/* lid center crease (left flap / right flap divider) */}
        <div
          className="absolute top-0 left-1/2 w-[1.5px]"
          style={{ height: "28%", background: "rgba(0,0,0,0.30)", transform: "translateX(-50%)" }}
        />
        {/* lid seal line */}
        <div
          className="absolute inset-x-0"
          style={{ top: "28%", height: "2.5px", background: "rgba(0,0,0,0.35)" }}
        />
        {/* packing tape */}
        {tape && (
          <div
            className="absolute inset-x-0"
            style={{
              top: "24%",
              height: "8%",
              background: "rgba(215,195,130,0.55)",
              borderTop: "1px solid rgba(255,255,255,0.25)",
              borderBottom: "1px solid rgba(0,0,0,0.12)",
            }}
          />
        )}
        {/* bottom shadow gradient */}
        <div
          className="absolute inset-x-0 bottom-0 h-10"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.22), transparent)" }}
        />
        {/* right-edge shadow for subtle 3-D */}
        <div
          className="absolute inset-y-0 right-0 w-4"
          style={{ background: "linear-gradient(to left, rgba(0,0,0,0.18), transparent)" }}
        />
        {/* highlight on top-left */}
        <div
          className="absolute left-0 top-0 h-10 w-10"
          style={{ background: "radial-gradient(circle at 0 0, rgba(255,255,255,0.18), transparent 70%)" }}
        />
      </div>

      {/* ── string / twine ── */}
      {tied && (
        <>
          <div
            className="absolute inset-y-0 left-1/2 rounded-full"
            style={{ width: "2.5px", transform: "translateX(-50%)", background: "rgba(240,225,185,0.85)" }}
          />
          <div
            className="absolute inset-x-0 top-1/2 rounded-full"
            style={{ height: "2.5px", transform: "translateY(-50%)", background: "rgba(240,225,185,0.85)" }}
          />
          {/* knot */}
          <div
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: "14px",
              height: "14px",
              transform: "translate(-50%,-50%)",
              background: "radial-gradient(circle, #f0e0b0 30%, #c8a86a 100%)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            }}
          />
        </>
      )}
    </div>
  );
}

export default function Home() {
  const features = [
    {
      title: "Mudanzas para hogar y oficina",
      description:
        "Traslados completos dentro de Santiago y hacia regiones, con equipo capacitado para manipular muebles, electrodomesticos y cajas fragiles.",
    },
    {
      title: "Fletes express el mismo dia",
      description:
        "Servicio rapido para envios urgentes dentro de la Region Metropolitana, con confirmacion y seguimiento por WhatsApp.",
    },
    {
      title: "Transporte de carga a todo Chile",
      description:
        "Coordinamos rutas interurbanas para mercaderia, pallets y carga consolidada con tiempos de entrega claros desde el inicio.",
    },
  ];

  return (
    <div className="bg-slate-50 text-slate-900">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 border-b backdrop-blur"
        style={{ background: `${navy}f2`, borderColor: `${navy}cc` }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <a href="#" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Transportes EP3"
              width={200}
              height={78}
              className="h-16 w-auto"
              priority
            />
          </a>
          <nav className="hidden gap-6 text-sm font-semibold text-white/80 md:flex">
            <a href="#servicios" className="transition hover:text-ep3-yellow">
              Servicios
            </a>
          </nav>
          <a
            href="https://wa.link/9rr0si"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition hover:brightness-110 md:inline-flex"
            style={{ background: yellow, color: navy }}
          >
            Escribir a WhatsApp
          </a>
        </div>
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden"
          style={{
            background: navy,
            backgroundImage: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 119px,
                rgba(255,255,255,0.04) 120px
              )
            `,
          }}
        >
          {/* tire track watermark */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 opacity-[0.08]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                #fff 0px, #fff 4px,
                transparent 4px, transparent 14px,
                #fff 14px, #fff 18px,
                transparent 18px, transparent 28px
              )`,
            }}
          />

          {/* yellow triangle accents — z-index 0, behind content */}
          {[
            { top: "12%", right: "28%", size: 20, opacity: 0.7  },
            { top: "8%",  right: "20%", size: 14, opacity: 0.5  },
            { top: "28%", right: "14%", size: 24, opacity: 0.65 },
            { top: "18%", right: "36%", size: 12, opacity: 0.45 },
            { top: "38%", right: "22%", size: 16, opacity: 0.6  },
          ].map((t, i) => (
            <div
              key={i}
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                zIndex: 0,
                top: t.top,
                right: t.right,
                width: 0,
                height: 0,
                borderLeft: `${t.size}px solid transparent`,
                borderRight: `${t.size}px solid transparent`,
                borderBottom: `${t.size * 1.6}px solid ${yellow}`,
                opacity: t.opacity,
              }}
            />
          ))}

          <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-6 px-6 py-16 md:grid-cols-2 md:py-24">
            {/* Left: package scene */}
            <div className="relative h-80 md:h-[480px]">
              {BOXES.map((box, i) => (
                <PackageBox key={i} {...box} />
              ))}
            </div>

            {/* Right: headline + logo + CTA */}
            <div className="flex flex-col items-end gap-6 text-right">
              <h1 className="text-4xl font-extrabold leading-tight text-white md:text-5xl">
                TODOS TUS<br />
                PAQUETES ESTÁN<br />
                SEGUROS CON
              </h1>
              <Image
                src="/logo.png"
                alt="Transportes EP3"
                width={280}
                height={110}
                className="w-56 md:w-72"
                priority
              />
              <a
                href="https://wa.link/9rr0si"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold shadow-lg transition hover:brightness-110 hover:shadow-xl"
                style={{ background: yellow, color: navy }}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Escribir a WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* ── Services ───────────────────────────────────────────── */}
        <section id="servicios" className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-bold text-slate-900">
              Soluciones de transporte para cada necesidad
            </h2>
            <p className="mt-3 text-slate-600">
              Desde mudanzas completas hasta envios puntuales, operamos con
              protocolos de seguridad y coordinacion en tiempo real.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Transportes EP3. Todos los derechos reservados.</p>
          <p>Servicio disponible 24/7</p>
        </div>
      </footer>
    </div>
  );
}
