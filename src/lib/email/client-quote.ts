/**
 * Client quote (presupuesto) notice.
 * Uses Resend when RESEND_API_KEY is set; otherwise logs a mock payload.
 * Emits branded HTML templates (#001F54 navy, #FFCC00 yellow, #c4863a kraft).
 */

import { formatClpPlusIva } from "@/lib/format";
import { clientMessageFromNotes } from "@/lib/quote-pricing";
import { deliverEmail, escapeHtml, type EmailDeliveryResult } from "./deliver";

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

const BRAND_NAVY = "#001F54";
const BRAND_YELLOW = "#FFCC00";
const BRAND_KRAFT = "#c4863a";

export function clientQuoteTotalLabel(amount: string | number) {
  return formatClpPlusIva(amount);
}

/**
 * The priced quote is emailed only when the presupuesto is approved.
 * Submitting a cotización sends a separate acknowledgment with no price.
 * Marking a presupuesto sent does not email the priced quote.
 */
export function shouldEmailQuoteToClient(currentStatus: string, nextStatus: string) {
  return nextStatus === "approved" && currentStatus !== "approved";
}

function renderClientQuoteHtml(payload: ClientQuoteEmailPayload): string {
  const total = clientQuoteTotalLabel(payload.totalAmount);
  const notes = clientMessageFromNotes(payload.notes);
  const validUntilHtml = payload.validUntil
    ? `<div style="font-size: 13px; color: #64748B; margin-top: 6px;">Válida hasta: <strong style="color: ${BRAND_NAVY};">${escapeHtml(payload.validUntil)}</strong></div>`
    : "";
  const notesHtml = notes
    ? `<div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 16px; margin: 20px 0; font-size: 14px; color: #334155; line-height: 1.5;">${escapeHtml(notes)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu cotización — Transportes EP3</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F1F5F9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 16px rgba(0, 31, 84, 0.08);">
          
          <!-- Top Yellow Accent -->
          <tr>
            <td style="height: 6px; background-color: ${BRAND_YELLOW}; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="background-color: ${BRAND_NAVY}; padding: 32px;">
              <div style="font-size: 24px; font-weight: 900; letter-spacing: 1.5px; color: #FFFFFF; text-transform: uppercase;">
                TRANSPORTES <span style="color: ${BRAND_YELLOW};">EP3</span>
              </div>
              <div style="font-size: 13px; color: #94A3B8; margin-top: 4px;">
                MUDANZAS &amp; LOGÍSTICA RESIDENCIAL
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 12px; font-size: 22px; color: ${BRAND_NAVY}; font-weight: 800;">
                ¡Hola ${escapeHtml(payload.clientName)}!
              </h1>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
                Te enviamos la cotización detallada de tu mudanza: <strong>${escapeHtml(payload.title)}</strong>.
              </p>

              <!-- Price Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border: 2px solid ${BRAND_NAVY}; border-radius: 10px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: ${BRAND_KRAFT};">
                      Total Cotizado
                    </div>
                    <div style="font-size: 32px; font-weight: 900; color: ${BRAND_NAVY}; margin-top: 6px;">
                      ${total}
                    </div>
                    <div style="font-size: 12px; color: #64748B; margin-top: 4px;">
                      El precio indicado no incluye IVA; el IVA se suma al emitir factura si se requiere.
                    </div>
                    ${validUntilHtml}
                  </td>
                </tr>
              </table>

              ${notesHtml}

              <!-- Action Buttons -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="https://wa.me/56984898375?text=Hola%20Transportes%20EP3,%20recibí%20la%20cotización%20${encodeURIComponent(payload.title)}" 
                       style="display: inline-block; background-color: #25D366; color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 2px 6px rgba(37, 211, 102, 0.3);">
                      💬 Aceptar o Consultar por WhatsApp
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 14px;">
                    <a href="tel:+56984898375" style="font-size: 13px; color: ${BRAND_NAVY}; font-weight: 700; text-decoration: underline;">
                      O contáctanos al +56 9 8489 8375
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 32px; text-align: center;">
              <div style="font-size: 13px; font-weight: 700; color: ${BRAND_NAVY};">
                Transportes EP3 — Mudanzas Profesionales
              </div>
              <div style="font-size: 12px; color: #64748B; margin-top: 4px;">
                Santiago, Chile · <a href="https://www.transportesep3.cl" style="color: ${BRAND_NAVY}; text-decoration: underline;">www.transportesep3.cl</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildClientQuoteEmail(payload: ClientQuoteEmailPayload): {
  to: string | null;
  subject: string;
  text: string;
  html: string;
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
    html: renderClientQuoteHtml(payload),
  };
}

export async function notifyClientQuote(
  payload: ClientQuoteEmailPayload,
): Promise<ClientQuoteEmailResult> {
  return deliverEmail(buildClientQuoteEmail(payload));
}
