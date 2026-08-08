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
import { createBudget } from "@/lib/actions/budgets";

export default async function NuevoPresupuestoPage() {
  const clientRows = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .orderBy(asc(clients.name));

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Nuevo presupuesto" />
      <PanelCard>
        {clientRows.length === 0 ? (
          <p className="text-sm text-ep3-navy/70">
            Primero crea un cliente en Clientes.
          </p>
        ) : (
          <form action={createBudget} className="space-y-4">
            <SelectField
              label="Cliente"
              name="clientId"
              required
              options={clientRows.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
            />
            <Field
              label="Título"
              name="title"
              required
              placeholder="Mudanza depto Ñuñoa"
            />
            <Field label="Válido hasta" name="validUntil" type="date" />
            <TextArea label="Notas" name="notes" />
            <SubmitButton label="Crear borrador" />
          </form>
        )}
      </PanelCard>
    </div>
  );
}
