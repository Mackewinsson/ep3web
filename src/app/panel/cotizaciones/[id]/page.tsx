import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BackLink,
  Field,
  PageHeader,
  PanelCard,
  SelectField,
  StatusBadge,
  SubmitButton,
  TextArea,
} from "@/components/panel/ui";
import { db } from "@/db";
import { clients, quoteRequests, servicePackages } from "@/db/schema";
import {
  convertQuoteToBudget,
  setQuoteStatus,
  updateQuoteRequest,
} from "@/lib/actions/quotes";
import { QUOTE_STATUS_LABELS, quoteStatusTone } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

const inputClassName =
  "w-full rounded-md border border-ep3-navy/20 bg-white px-3 py-2.5 text-base text-ep3-navy outline-none focus:border-ep3-navy md:text-sm";

export default async function CotizacionDetailPage({ params }: Props) {
  const { id } = await params;

  const [quote] = await db
    .select()
    .from(quoteRequests)
    .where(eq(quoteRequests.id, id))
    .limit(1);

  if (!quote) notFound();

  const [clientRows, packageRows] = await Promise.all([
    db
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .orderBy(asc(clients.name)),
    db
      .select({ id: servicePackages.id, name: servicePackages.name })
      .from(servicePackages)
      .where(eq(servicePackages.active, true))
      .orderBy(asc(servicePackages.sortOrder)),
  ]);

  const update = updateQuoteRequest.bind(null, id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <BackLink href="/panel/cotizaciones" label="Volver a cotizaciones" />
        <PageHeader
          title="Detalle de cotización"
          description={`Origen: ${quote.source === "website" ? "Sitio web" : "Panel"}`}
        />
      </div>

      <PanelCard>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <StatusBadge
            label={QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
            tone={quoteStatusTone(quote.status)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {quote.status !== "converted" && quote.status !== "closed" ? (
            <>
              {quote.status === "new" ? (
                <form action={setQuoteStatus.bind(null, id, "in_progress")}>
                  <button
                    type="submit"
                    className="min-h-11 rounded-md bg-ep3-navy px-3 py-2 text-sm text-white"
                  >
                    Marcar en gestión
                  </button>
                </form>
              ) : null}
              <form action={setQuoteStatus.bind(null, id, "closed")}>
                <button
                  type="submit"
                  className="min-h-11 rounded-md border border-ep3-navy/20 px-3 py-2 text-sm text-ep3-navy"
                >
                  Cerrar
                </button>
              </form>
              <form action={convertQuoteToBudget.bind(null, id)}>
                <button
                  type="submit"
                  className="min-h-11 rounded-md bg-ep3-yellow px-3 py-2 text-sm font-semibold text-ep3-navy"
                >
                  Crear presupuesto
                </button>
              </form>
            </>
          ) : null}
          {quote.status === "converted" ? (
            <p className="text-sm text-ep3-navy/60">
              Ya convertida a presupuesto.{" "}
              <Link
                href="/panel/presupuestos"
                className="font-medium underline"
              >
                Ver presupuestos
              </Link>
            </p>
          ) : null}
          {quote.status === "closed" ? (
            <form action={setQuoteStatus.bind(null, id, "in_progress")}>
              <button
                type="submit"
                className="min-h-11 rounded-md border border-ep3-navy/20 px-3 py-2 text-sm text-ep3-navy"
              >
                Reabrir
              </button>
            </form>
          ) : null}
        </div>
      </PanelCard>

      <PanelCard>
        <form action={update} className="space-y-4">
          <SelectField
            label="Cliente"
            name="clientId"
            required
            defaultValue={quote.clientId}
            options={clientRows.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
          />
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ep3-navy">
              Paquete (opcional)
            </span>
            <select
              name="packageId"
              defaultValue={quote.packageId ?? ""}
              className={inputClassName}
            >
              <option value="">Sin paquete / a medida</option>
              {packageRows.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <TextArea
            label="Dirección origen"
            name="originAddress"
            required
            defaultValue={quote.originAddress}
          />
          <TextArea
            label="Dirección destino"
            name="destinationAddress"
            required
            defaultValue={quote.destinationAddress}
          />
          <Field
            label="Fecha preferida"
            name="preferredDate"
            type="date"
            defaultValue={quote.preferredDate ?? undefined}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="m³ estimados"
              name="estimatedM3"
              type="number"
              step="0.1"
              defaultValue={quote.estimatedM3 ?? undefined}
            />
            <Field
              label="Nº elementos"
              name="estimatedItems"
              type="number"
              step="1"
              defaultValue={quote.estimatedItems ?? undefined}
            />
          </div>
          <TextArea
            label="Volumen / notas"
            name="volumeNotes"
            rows={4}
            defaultValue={quote.volumeNotes}
          />
          <SubmitButton label="Guardar cambios" />
        </form>
      </PanelCard>
    </div>
  );
}
