import Image from "next/image";

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
      <header className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Transportes EP3"
              width={240}
              height={94}
              className="h-20 w-auto"
              priority
            />
          </a>
          <nav className="hidden gap-6 text-sm font-medium text-slate-200 md:flex">
            <a href="#servicios" className="hover:text-white">
              Servicios
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 text-white">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <div className="max-w-2xl space-y-6">
              <p className="inline-flex rounded-full bg-white/20 px-4 py-1 text-sm font-semibold">
                Servicio confiable en todo Chile
              </p>
              <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
                Transporte y mudanzas sin complicaciones
              </h1>
              <p className="max-w-xl text-lg text-blue-50">
                Gestionamos fletes, mudanzas y traslados de carga con puntualidad,
                seguridad y atencion personalizada para hogares y empresas.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://wa.link/9rr0si"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  Cotizar ahora
                </a>
                <a
                  href="https://wa.link/9rr0si"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/50 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Llamar asesor
                </a>
              </div>
            </div>
          </div>
        </section>

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
          <p>Servicio de lunes a domingo, 9:00 - 19:00</p>
        </div>
      </footer>
    </div>
  );
}
