/**
 * Client quote (presupuesto) notice.
 * Uses Resend when RESEND_API_KEY is set; otherwise logs a mock payload.
 */

import { formatClpPlusIva } from "@/lib/format";
import { clientMessageFromNotes } from "@/lib/quote-pricing";
import { deliverEmail, type EmailDeliveryResult } from "./deliver";

export type ClientQuoteEmailPayload = {
  clientName: string;
  clientEmail: string | null;
  title: string;
  totalAmount: string | number;
  validUntil?: string | null;
  notes?: string | null;
};

export type ClientQuoteEmailResult = EmailDeliveryResult;

export const CLIENT_QUOTE_SUBJECT_PREFIX = "Tu cotización — ";

export function clientQuoteTotalLabel(amount: string | number) {
  return formatClpPlusIva(amount);
}

/**
 * Explicit send always emails. Approving emails only when the quote was never
 * marked sent — that is the path that used to create a job with no client mail.
 */
export function shouldEmailQuoteToClient(currentStatus: string, nextStatus: string) {
  if (nextStatus === "sent") return true;
  return nextStatus === "approved" && currentStatus !== "sent";
}

export function buildClientQuoteEmail(payload: ClientQuoteEmailPayload): {
  to: string | null;
  subject: string;
  text: string;
} {
  const to = payload.clientEmail?.trim() || null;
  const total = clientQuoteTotalLabel(payload.totalAmount);
  const valid = payload.validUntil
    ? `Válida hasta: ${payload.validUntil}`
    : "";
  const notes = clientMessageFromNotes(payload.notes);
  const text = [
    `Hola ${payload.clientName},`,
    "Te enviamos la cotización de tu mudanza.",
    payload.title,
    `Total: ${total}`,
    "El precio indicado no incluye IVA; el IVA se suma después.",
    valid,
    notes,
    "— Transportes EP3",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    to,
    subject: `${CLIENT_QUOTE_SUBJECT_PREFIX}${payload.title}`,
    text,
  };
}

export async function notifyClientQuote(
  payload: ClientQuoteEmailPayload,
): Promise<ClientQuoteEmailResult> {
  return deliverEmail(buildClientQuoteEmail(payload));
}
