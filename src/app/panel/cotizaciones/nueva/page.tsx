import { asc } from "drizzle-orm";
import {
  Field,
  PageHeader,
  PanelCard,
  SelectField,
  SubmitButton,
  TextArea,
} from "@/components/panel/ui";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { createQuoteRequest } from "@/lib/actions/quotes";

export default async function NuevaCotizacionPage() {
  const clientRows = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .orderBy(asc(clients.name));

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Nueva cotización"
        description="Pedido de presupuesto del cliente"
      />
      <PanelCard>
        {clientRows.length === 0 ? (
          <p className="text-sm text-ep3-navy/70">
            Primero crea un cliente en Clientes.
          </p>
        ) : (
          <form action={createQuoteRequest} className="space-y-4">
            <SelectField
              label="Cliente"
              name="clientId"
              required
              options={clientRows.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
            />
            <TextArea
              label="Dirección origen"
              name="originAddress"
              required
            />
            <TextArea
              label="Dirección destino"
              name="destinationAddress"
              required
            />
            <Field label="Fecha preferida" name="preferredDate" type="date" />
            <TextArea
              label="Volumen / notas"
              name="volumeNotes"
              rows={4}
            />
            <SubmitButton label="Guardar cotización" />
          </form>
        )}
      </PanelCard>
    </div>
  );
}
