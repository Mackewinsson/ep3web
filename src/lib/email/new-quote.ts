/**
 * New quote submission email notices (Client confirmation + Admin notification).
 * Uses Resend via deliverEmail when RESEND_API_KEY is set.
 */

import { formatClpPlusIva } from "@/lib/format";
import { formatM3 } from "@/lib/quote-pricing";
import { deliverEmail, type EmailDeliveryResult } from "./deliver";

export type NewQuoteEmailPayload = {
  quoteId: string;
  budgetId?: string | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  originAddress: string;
  destinationAddress: string;
  totalM3: number;
  estimatedAmount: number;
  preferredDate?: string | null;
  preferredTime?: string | null;
  notes?: string | null;
  siteUrl?: string;
};

export const NEW_QUOTE_CLIENT_SUBJECT =
  "Hemos recibido tu solicitud de cotización — Transportes EP3";

export function buildNewQuoteClientEmail(payload: NewQuoteEmailPayload): {
  to: string;
  subject: string;
  text: string;
} {
  const formattedM3 = formatM3(payload.totalM3);
  const formattedEstimate = formatClpPlusIva(Math.round(payload.estimatedAmount));
  const dateLine = payload.preferredDate
    ? `Fecha solicitada: ${payload.preferredDate}${payload.preferredTime ? ` a las ${payload.preferredTime}` : ""}`
    : "";

  const text = [
    `Hola ${payload.clientName},`,
    "",
    "¡Hemos recibido tu solicitud de cotización con éxito!",
    "",
    "Resumen de tu mudanza:",
    `• Origen: ${payload.originAddress}`,
    `• Destino: ${payload.destinationAddress}`,
    `• Volumen estimado: ${formattedM3} m³`,
    `• Estimación inicial: ${formattedEstimate}`,
    dateLine,
    "",
    "Nuestro equipo de operaciones está revisando los detalles para enviarte una cotización formal y coordinar la disponibilidad.",
    "",
    "Si necesitas ajustar algún detalle o tienes dudas urgentes, puedes responder a este correo o contactarnos directamente por WhatsApp o teléfono al +56 9 8489 8375.",
    "",
    "Saludos cordiales,",
    "Equipo de Transportes EP3",
    "https://www.transportesep3.cl",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    to: payload.clientEmail.trim(),
    subject: NEW_QUOTE_CLIENT_SUBJECT,
    text,
  };
}

export function buildNewQuoteAdminEmail(
  payload: NewQuoteEmailPayload,
  adminRecipient: string,
): {
  to: string;
  subject: string;
  text: string;
} {
  const formattedM3 = formatM3(payload.totalM3);
  const formattedEstimate = formatClpPlusIva(Math.round(payload.estimatedAmount));
  const siteUrl = payload.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://www.transportesep3.cl";
  const budgetLink = payload.budgetId
    ? `${siteUrl}/panel/presupuestos/${payload.budgetId}`
    : `${siteUrl}/panel/cotizaciones`;

  const dateLine = payload.preferredDate
    ? `• Fecha preferida: ${payload.preferredDate}${payload.preferredTime ? ` (${payload.preferredTime})` : ""}`
    : "";
  const notesLine = payload.notes ? `• Notas cliente: ${payload.notes}` : "";

  const text = [
    "🔔 Nueva cotización recibida desde el cotizador web:",
    "",
    `• Cliente: ${payload.clientName}`,
    `• Teléfono: ${payload.clientPhone}`,
    `• Correo: ${payload.clientEmail}`,
    `• Origen: ${payload.originAddress}`,
    `• Destino: ${payload.destinationAddress}`,
    `• Volumen estimado: ${formattedM3} m³`,
    `• Monto estimado: ${formattedEstimate}`,
    dateLine,
    notesLine,
    "",
    `Revisar en el panel: ${budgetLink}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    to: adminRecipient.trim(),
    subject: `🔔 Nueva cotización web: ${payload.clientName} (${formattedM3} m³)`,
    text,
  };
}

export async function notifyNewQuoteSubmitted(
  payload: NewQuoteEmailPayload,
): Promise<{
  clientResult: EmailDeliveryResult;
  adminResult: EmailDeliveryResult | null;
}> {
  // 1. Send confirmation to client
  const clientEmailData = buildNewQuoteClientEmail(payload);
  const clientResult = await deliverEmail(clientEmailData);

  // 2. Send alert to admin
  const adminEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.ADMIN_EMAIL ||
    "admin@transportesep3.cl";

  let adminResult: EmailDeliveryResult | null = null;
  if (adminEmail) {
    const adminEmailData = buildNewQuoteAdminEmail(payload, adminEmail);
    adminResult = await deliverEmail(adminEmailData);
  }

  return { clientResult, adminResult };
}
