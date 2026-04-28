import Image from "next/image";

export default function Home() {
  const benefits = [
    "Puntualidad garantizada",
    "Cobertura nacional",
    "Carga protegida",
    "Flota moderna",
  ];

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

  const processSteps = [
    {
      step: "1",
      title: "Cuentanos lo que necesitas",
      description:
        "Indicanos origen, destino y tipo de carga para recomendarte el servicio adecuado.",
    },
    {
      step: "2",
      title: "Recibe una cotizacion clara",
      description:
        "Te enviamos un presupuesto sin costos ocultos y con todos los detalles incluidos.",
    },
    {
      step: "3",
      title: "Agenda fecha y horario",
      description:
        "Selecciona el dia que mejor te acomode. Trabajamos de lunes a domingo.",
    },
    {
      step: "4",
      title: "Nos encargamos del traslado",
      description:
        "Retiramos, transportamos y entregamos tu carga con puntualidad y cuidado.",
    },
  ];

  const coverage = [
    "Region Metropolitana",
    "Valparaiso",
    "O'Higgins",
    "Maule",
    "Biobio",
    "Araucania",
    "Los Lagos",
    "Coquimbo",
    "Atacama",
    "Antofagasta",
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
            <a href="#proceso" className="hover:text-white">
              Como funciona
            </a>
            <a href="#cobertura" className="hover:text-white">
              Cobertura
            </a>
            <a href="#contacto" className="hover:text-white">
              Contacto
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:py-24">
            <div className="space-y-6">
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
                  href="#contacto"
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  Cotizar ahora
                </a>
                <a
                  href="tel:+56900000000"
                  className="rounded-full border border-white/50 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Llamar asesor
                </a>
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur">
              <h2 className="text-lg font-bold">Por que elegirnos</h2>
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {benefits.map((item) => (
                  <li
                    key={item}
                    className="rounded-xl bg-white/10 px-4 py-3 text-sm font-medium"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-2xl font-bold">+500</p>
                  <p className="text-xs uppercase tracking-wide text-blue-100">
                    Clientes
                  </p>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-2xl font-bold">+1.000</p>
                  <p className="text-xs uppercase tracking-wide text-blue-100">
                    Traslados
                  </p>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-2xl font-bold">4.9/5</p>
                  <p className="text-xs uppercase tracking-wide text-blue-100">
                    Promedio
                  </p>
                </div>
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

        <section id="proceso" className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-3xl font-bold text-slate-900">
              Como funciona en 4 pasos
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {processSteps.map((step) => (
                <div
                  key={step.step}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 font-bold text-white">
                    {step.step}
                  </span>
                  <h3 className="mt-4 font-semibold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cobertura" className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="rounded-3xl bg-slate-900 p-8 text-white md:p-12">
            <h2 className="text-3xl font-bold">Cobertura nacional</h2>
            <p className="mt-3 max-w-3xl text-slate-300">
              Realizamos traslados desde la Region Metropolitana a las principales
              ciudades del pais. Agenda tu servicio y recibe seguimiento del envio.
            </p>
            <ul className="mt-8 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-5">
              {coverage.map((region) => (
                <li
                  key={region}
                  className="rounded-xl bg-white/10 px-3 py-2 text-center"
                >
                  {region}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="contacto" className="bg-blue-700 py-16 text-white">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <h2 className="text-3xl font-bold">Listo para cotizar tu traslado?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-blue-100">
              Escribenos por WhatsApp o llamanos para recibir una propuesta en
              minutos, sin costos ocultos.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="https://wa.me/56900000000"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Hablar por WhatsApp
              </a>
              <a
                href="mailto:contacto@transportesep3.cl"
                className="rounded-full border border-white/50 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Enviar correo
              </a>
            </div>
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
