import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  BackLink,
  Field,
  PageHeader,
  PanelCard,
  SubmitButton,
  TextArea,
} from "@/components/panel/ui";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { updateClient } from "@/lib/actions/clients";

type Props = { params: Promise<{ id: string }> };

export default async function ClienteDetailPage({ params }: Props) {
  const { id } = await params;
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1);

  if (!client) notFound();

  const action = updateClient.bind(null, id);

  return (
    <div className="mx-auto max-w-xl">
      <BackLink href="/panel/clientes" label="Volver a clientes" />
      <PageHeader title={client.name} description="Editar cliente" />
      <PanelCard>
        <form action={action} className="space-y-4">
          <Field label="Nombre" name="name" required defaultValue={client.name} />
          <Field label="Teléfono" name="phone" defaultValue={client.phone} />
          <Field
            label="Correo"
            name="email"
            type="email"
            defaultValue={client.email}
          />
          <TextArea label="Notas" name="notes" defaultValue={client.notes} />
          <SubmitButton label="Guardar cambios" />
        </form>
      </PanelCard>
    </div>
  );
}
