/**
 * Client quote (presupuesto) notice.
 * Uses Resend when RESEND_API_KEY is set; otherwise logs a mock payload.
 */

import { formatClpPlusIva } from "@/lib/format";

export type ClientQuoteEmailPayload = {
  clientName: string;
  clientEmail: string | null;
  title: string;
  totalAmount: string | number;
  validUntil?: string | null;
  notes?: string | null;
};

export type ClientQuoteEmailResult = {
  mocked: boolean;
  skipped: boolean;
  to: string | null;
  subject: string;
};

export const CLIENT_QUOTE_SUBJECT_PREFIX = "Tu cotización — ";

export function clientQuoteTotalLabel(amount: string | number) {
  return formatClpPlusIva(amount);
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
  const notes = payload.notes?.trim() || "";
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function notifyClientQuote(
  payload: ClientQuoteEmailPayload,
): Promise<ClientQuoteEmailResult> {
  const email = buildClientQuoteEmail(payload);
  const to = email.to;
  const skipped = !to;

  if (skipped) {
    console.info("[email:mock] client quote skipped (no email)", {
      subject: email.subject,
    });
    return {
      mocked: true,
      skipped: true,
      to: null,
      subject: email.subject,
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info("[email:mock] client quote", {
      to,
      subject: email.subject,
      text: email.text,
    });
    return {
      mocked: true,
      skipped: false,
      to,
      subject: email.subject,
    };
  }

  try {
    const { Resend } = await import("resend");
    const from =
      process.env.EMAIL_FROM ?? "Transportes EP3 <onboarding@resend.dev>";
    const resend = new Resend(apiKey);
    const htmlText = escapeHtml(email.text).replace(/\n/g, "<br/>");
    const { error } = await resend.emails.send({
      from,
      to,
      subject: email.subject,
      text: email.text,
      html: `<div style="font-family: sans-serif; color: #001F54;">${htmlText}</div>`,
    });
    if (error) {
      console.error("[email] client quote failed", error.message);
    }
  } catch (err) {
    console.error("[email] client quote failed", err);
  }

  return {
    mocked: false,
    skipped: false,
    to,
    subject: email.subject,
  };
}
