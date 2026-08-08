import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import {
  BackLink,
  Field,
  PageHeader,
  PanelCard,
  SubmitButton,
  TextArea,
} from "@/components/panel/ui";
import { db } from "@/db";
import { clients, servicePackages } from "@/db/schema";
import { createQuoteRequest } from "@/lib/actions/quotes";

const inputClassName =
  "w-full rounded-md border border-ep3-navy/20 bg-white px-3 py-2.5 text-base text-ep3-navy outline-none focus:border-ep3-navy md:text-sm";

export default async function NuevaCotizacionPage() {
  const [clientRows, packageRows] = await Promise.all([
    db
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .orderBy(asc(clients.name)),
    db
      .select({
        id: servicePackages.id,
        name: servicePackages.name,
      })
      .from(servicePackages)
      .where(eq(servicePackages.active, true))
      .orderBy(asc(servicePackages.sortOrder)),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <BackLink href="/panel/cotizaciones" label="Volver a cotizaciones" />
      <PageHeader
        title="Nueva cotización"
        description="Pedido de presupuesto del cliente"
      />
      <PanelCard>
        {clientRows.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-ep3-navy/70">
              No hay clientes aún. Puedes crear uno aquí o{" "}
              <Link
                href="/panel/clientes/nuevo"
                className="font-medium text-ep3-navy underline"
              >
                ir a Clientes
              </Link>
              .
            </p>
            <form action={createQuoteRequest} className="space-y-4">
              <Field label="Nombre del cliente" name="clientName" required />
              <Field label="Teléfono" name="clientPhone" required />
              <QuoteSharedFields packageRows={packageRows} />
              <SubmitButton label="Guardar cotización" />
            </form>
          </div>
        ) : (
          <form action={createQuoteRequest} className="space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ep3-navy">
                Cliente existente
              </span>
              <select name="clientId" defaultValue="" className={inputClassName}>
                <option value="">— O crear abajo —</option>
                {clientRows.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-md border border-dashed border-ep3-navy/20 p-3">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ep3-navy/55">
                O crear cliente al vuelo
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nombre" name="clientName" />
                <Field label="Teléfono" name="clientPhone" />
              </div>
            </div>
            <QuoteSharedFields packageRows={packageRows} />
            <SubmitButton label="Guardar cotización" />
          </form>
        )}
      </PanelCard>
    </div>
  );
}

function QuoteSharedFields({
  packageRows,
}: {
  packageRows: { id: string; name: string }[];
}) {
  return (
    <>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ep3-navy">
          Paquete (opcional)
        </span>
        <select name="packageId" defaultValue="" className={inputClassName}>
          <option value="">Sin paquete / a medida</option>
          {packageRows.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <TextArea label="Dirección origen" name="originAddress" required />
      <TextArea label="Dirección destino" name="destinationAddress" required />
      <Field label="Fecha preferida" name="preferredDate" type="date" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="m³ estimados"
          name="estimatedM3"
          type="number"
          step="0.1"
        />
        <Field
          label="Nº elementos"
          name="estimatedItems"
          type="number"
          step="1"
        />
      </div>
      <TextArea label="Volumen / notas" name="volumeNotes" rows={4} />
    </>
  );
}
