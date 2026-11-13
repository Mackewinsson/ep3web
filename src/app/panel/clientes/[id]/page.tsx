import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BackLink,
  Field,
  PageHeader,
  PanelCard,
  StatusBadge,
  SubmitButton,
  TextArea,
} from "@/components/panel/ui";
import { db } from "@/db";
import { budgets, clients, quoteRequests } from "@/db/schema";
import {
  sendClientFollowUpEmailAction,
  updateClient,
} from "@/lib/actions/clients";
import {
  BUDGET_STATUS_LABELS,
  budgetStatusTone,
  formatClpPlusIva,
  formatDate,
  QUOTE_STATUS_LABELS,
  quoteStatusTone,
} from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

function cleanWhatsAppPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("569") && digits.length === 11) return digits;
  if (digits.startsWith("9") && digits.length === 9) return `56${digits}`;
  if (digits.length >= 8) return digits;
  return null;
}

export default async function ClienteDetailPage({ params }: Props) {
  const { id } = await params;

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1);

  if (!client) notFound();

  // Fetch all quote requests and budgets for this client
  const clientQuotes = await db
    .select({
      id: quoteRequests.id,
      originAddress: quoteRequests.originAddress,
      destinationAddress: quoteRequests.destinationAddress,
      estimatedM3: quoteRequests.estimatedM3,
      preferredDate: quoteRequests.preferredDate,
      source: quoteRequests.source,
      status: quoteRequests.status,
      volumeNotes: quoteRequests.volumeNotes,
      createdAt: quoteRequests.createdAt,
      budgetId: budgets.id,
      budgetTitle: budgets.title,
      budgetTotal: budgets.totalAmount,
      budgetStatus: budgets.status,
    })
    .from(quoteRequests)
    .leftJoin(budgets, eq(budgets.quoteRequestId, quoteRequests.id))
    .where(eq(quoteRequests.clientId, id))
    .orderBy(desc(quoteRequests.createdAt));

  const isWebLead =
    client.notes?.toLowerCase().includes("cotizador web") ||
    clientQuotes.some((q) => q.source === "website");

  const waPhone = cleanWhatsAppPhone(client.phone);
  const waText = encodeURIComponent(
    `Hola ${client.name}, te escribimos de Transportes EP3 respecto a tu cotización de mudanza.`,
  );

  const updateAction = updateClient.bind(null, id);
  const followUpAction = async () => {
    "use server";
    await sendClientFollowUpEmailAction(id);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BackLink href="/panel/clientes" label="Volver a Clientes & Leads" />

      {/* Header Profile Card */}
      <PanelCard className="border-t-4 border-t-ep3-yellow">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-ep3-navy">{client.name}</h1>
              {isWebLead ? (
                <StatusBadge label="Lead Web" tone="accent" />
              ) : (
                <StatusBadge label="Cliente Registrado" tone="default" />
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Registrado el {formatDate(client.createdAt)}
            </p>
          </div>

          {/* Quick Communication Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {waPhone ? (
              <a
                href={`https://wa.me/${waPhone}?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                💬 WhatsApp
              </a>
            ) : null}

            {client.phone ? (
              <a
                href={`tel:${client.phone}`}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-ep3-navy/20 bg-white px-3.5 py-2 text-sm font-semibold text-ep3-navy hover:bg-slate-50"
              >
                📞 Llamar
              </a>
            ) : null}

            {client.email ? (
              <a
                href={`mailto:${client.email}`}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-ep3-navy/20 bg-white px-3.5 py-2 text-sm font-semibold text-ep3-navy hover:bg-slate-50"
              >
                ✉️ Enviar correo
              </a>
            ) : null}
          </div>
        </div>

        {/* Email Outreach Trigger (For future automated iterations or 1-click resend) */}
        {client.email ? (
          <div className="mt-6 flex flex-col justify-between gap-3 rounded-lg border border-sky-100 bg-sky-50/70 p-4 sm:flex-row sm:items-center">
            <div>
              <div className="text-sm font-bold text-sky-950">
                Seguimiento por correo electrónico
              </div>
              <p className="text-xs text-sky-800">
                Envía un correo oficial de seguimiento con la plantilla corporativa a{" "}
                <strong className="font-semibold">{client.email}</strong>
              </p>
            </div>
            <form action={followUpAction}>
              <SubmitButton label="📩 Enviar seguimiento ahora" />
            </form>
          </div>
        ) : null}
      </PanelCard>

      {/* Associated Quotes & Moving History */}
      <PanelCard>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-ep3-navy">
            Historial de Cotizaciones &amp; Mudanzas
          </h2>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {clientQuotes.length} {clientQuotes.length === 1 ? "solicitud" : "solicitudes"}
          </span>
        </div>

        {clientQuotes.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Este contacto aún no tiene cotizaciones registradas.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {clientQuotes.map((q) => (
              <div key={q.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ep3-navy">
                        {q.budgetTitle || "Cotización Web"}
                      </span>
                      <StatusBadge
                        label={QUOTE_STATUS_LABELS[q.status] ?? q.status}
                        tone={quoteStatusTone(q.status)}
                      />
                      {q.budgetStatus ? (
                        <StatusBadge
                          label={
                            BUDGET_STATUS_LABELS[q.budgetStatus] ?? q.budgetStatus
                          }
                          tone={budgetStatusTone(q.budgetStatus)}
                        />
                      ) : null}
                    </div>

                    <div className="text-xs text-slate-600">
                      📍 <strong>Origen:</strong> {q.originAddress}
                    </div>
                    <div className="text-xs text-slate-600">
                      🏁 <strong>Destino:</strong> {q.destinationAddress}
                    </div>
                    {q.preferredDate ? (
                      <div className="text-xs text-slate-500">
                        📅 Fecha solicitada: {formatDate(q.preferredDate)}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-row items-baseline gap-3 sm:flex-col sm:items-end">
                    {q.budgetTotal ? (
                      <div className="text-base font-extrabold text-ep3-navy">
                        {formatClpPlusIva(q.budgetTotal)}
                      </div>
                    ) : null}
                    {q.estimatedM3 ? (
                      <div className="text-xs text-slate-500">
                        {q.estimatedM3} m³ estimados
                      </div>
                    ) : null}

                    {q.budgetId ? (
                      <Link
                        href={`/panel/presupuestos/${q.budgetId}`}
                        className="mt-1 inline-flex items-center text-xs font-bold text-ep3-navy hover:underline"
                      >
                        Abrir presupuesto →
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PanelCard>

      {/* Edit Client Information */}
      <PanelCard>
        <h2 className="mb-4 text-base font-bold text-ep3-navy">
          Editar Datos del Contacto
        </h2>
        <form action={updateAction} className="space-y-4">
          <Field
            label="Nombre completo"
            name="name"
            required
            defaultValue={client.name}
          />
          <Field
            label="Teléfono (Chile)"
            name="phone"
            defaultValue={client.phone ?? ""}
          />
          <Field
            label="Correo electrónico"
            name="email"
            type="email"
            defaultValue={client.email ?? ""}
          />
          <TextArea
            label="Notas / Historial del lead"
            name="notes"
            defaultValue={client.notes ?? ""}
          />
          <div className="pt-2">
            <SubmitButton label="Guardar cambios" />
          </div>
        </form>
      </PanelCard>
    </div>
  );
}
