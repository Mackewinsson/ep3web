/**
 * New quote submission email notices.
 * On submit, the client gets an acknowledgment titled "Cotización recibida"
 * with no price, totals, or item details. The admin gets the operations notice.
 * The priced quote is emailed later, when the presupuesto is approved.
 * Uses Resend via deliverEmail with branded EP3 HTML templates (#001F54 navy, #FFCC00 yellow, #c4863a kraft).
 */

import { formatClpPlusIva } from "@/lib/format";
import { formatM3 } from "@/lib/quote-pricing";
import { deliverEmail, escapeHtml, type EmailDeliveryResult } from "./deliver";

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
  "Cotización recibida — Transportes EP3";

const BRAND_NAVY = "#001F54";
const BRAND_YELLOW = "#FFCC00";
const BRAND_KRAFT = "#c4863a";

export function renderClientQuoteEmailHtml(payload: NewQuoteEmailPayload): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(NEW_QUOTE_CLIENT_SUBJECT)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F1F5F9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 16px rgba(0, 31, 84, 0.08);">
          
          <!-- Top Yellow Accent Bar -->
          <tr>
            <td style="height: 6px; background-color: ${BRAND_YELLOW}; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="background-color: ${BRAND_NAVY}; padding: 32px 32px 28px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 26px; font-weight: 900; letter-spacing: 1.5px; color: #FFFFFF; text-transform: uppercase;">
                      TRANSPORTES <span style="color: ${BRAND_YELLOW};">EP3</span>
                    </div>
                    <div style="font-size: 13px; color: #94A3B8; letter-spacing: 0.5px; margin-top: 4px; font-weight: 500;">
                      MUDANZAS &amp; LOGÍSTICA RESIDENCIAL
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: rgba(255, 204, 0, 0.15); border: 1px solid ${BRAND_YELLOW}; color: ${BRAND_YELLOW}; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 20px;">
                      Cotización recibida
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 12px; font-size: 22px; color: ${BRAND_NAVY}; font-weight: 800;">
                Cotización recibida
              </h1>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #475569;">
                Hola ${escapeHtml(payload.clientName)}, recibimos tu solicitud.
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
                Nuestro equipo la está revisando. Te enviaremos la cotización formal cuando esté lista.
              </p>

              <!-- Notice Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFBEB; border-left: 4px solid ${BRAND_YELLOW}; border-radius: 4px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #92400E;">
                      Este mensaje solo confirma que llegó tu solicitud. No incluye precio ni detalle de ítems.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Action Buttons -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <a href="https://wa.me/56984898375?text=Hola%20Transportes%20EP3,%20acabo%20de%20cotizar%20mi%20mudanza" 
                       style="display: inline-block; background-color: #25D366; color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 2px 6px rgba(37, 211, 102, 0.3);">
                      💬 Escríbenos por WhatsApp
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 14px;">
                    <span style="font-size: 13px; color: #64748B;">¿Prefieres llamar?</span>
                    <a href="tel:+56984898375" style="font-size: 13px; color: ${BRAND_NAVY}; font-weight: 700; text-decoration: underline; margin-left: 4px;">+56 9 8489 8375</a>
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
              <div style="font-size: 11px; color: #94A3B8; margin-top: 10px;">
                Este correo fue generado automáticamente por la plataforma de Transportes EP3.
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

export function renderAdminQuoteEmailHtml(
  payload: NewQuoteEmailPayload,
  adminRecipient: string,
): string {
  const formattedM3 = formatM3(payload.totalM3);
  const formattedEstimate = formatClpPlusIva(Math.round(payload.estimatedAmount));
  const siteUrl = payload.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://www.transportesep3.cl";
  const budgetLink = payload.budgetId
    ? `${siteUrl}/panel/presupuestos/${payload.budgetId}`
    : `${siteUrl}/panel/cotizaciones`;

  const dateFormatted = payload.preferredDate
    ? `${escapeHtml(payload.preferredDate)}${payload.preferredTime ? ` (${escapeHtml(payload.preferredTime)})` : ""}`
    : "No especificada";

  const notesHtml = payload.notes
    ? `<div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 16px; margin-top: 16px;">
        <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase;">Notas del cliente</div>
        <div style="font-size: 13px; color: #1E293B; margin-top: 2px;">${escapeHtml(payload.notes)}</div>
       </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva cotización web</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F1F5F9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 16px rgba(0, 31, 84, 0.08);">
          
          <!-- Top Yellow Accent Bar -->
          <tr>
            <td style="height: 6px; background-color: ${BRAND_YELLOW}; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="background-color: ${BRAND_NAVY}; padding: 28px 32px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 12px; font-weight: 800; letter-spacing: 1.5px; color: ${BRAND_YELLOW}; text-transform: uppercase;">
                      PANEL DE OPERACIONES
                    </div>
                    <div style="font-size: 22px; font-weight: 900; color: #FFFFFF; margin-top: 4px;">
                      🔔 Nueva Cotización Web
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: #FFFFFF; color: ${BRAND_NAVY}; font-size: 13px; font-weight: 800; padding: 6px 14px; border-radius: 20px;">
                      ${formattedM3} m³
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              
              <!-- Client Info Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: ${BRAND_KRAFT}; margin-bottom: 10px;">
                      👤 Datos del Cliente
                    </div>
                    <div style="font-size: 17px; font-weight: 800; color: ${BRAND_NAVY};">
                      ${escapeHtml(payload.clientName)}
                    </div>
                    <div style="font-size: 14px; color: #475569; margin-top: 6px;">
                      📞 <a href="tel:${escapeHtml(payload.clientPhone)}" style="color: ${BRAND_NAVY}; font-weight: 600; text-decoration: none;">${escapeHtml(payload.clientPhone)}</a>
                      &nbsp;·&nbsp;
                      ✉️ <a href="mailto:${escapeHtml(payload.clientEmail)}" style="color: ${BRAND_NAVY}; font-weight: 600; text-decoration: none;">${escapeHtml(payload.clientEmail)}</a>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Moving Route -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: ${BRAND_KRAFT}; margin-bottom: 10px;">
                      📍 Trayecto Solicitado
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-bottom: 10px;">
                          <div style="font-size: 11px; color: #64748B; font-weight: 700;">ORIGEN</div>
                          <div style="font-size: 14px; color: ${BRAND_NAVY}; font-weight: 700; margin-top: 2px;">
                            ${escapeHtml(payload.originAddress)}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="border-top: 1px dashed #CBD5E1; padding-top: 10px;">
                          <div style="font-size: 11px; color: #64748B; font-weight: 700;">DESTINO</div>
                          <div style="font-size: 14px; color: ${BRAND_NAVY}; font-weight: 700; margin-top: 2px;">
                            ${escapeHtml(payload.destinationAddress)}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Numbers Grid -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="50%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px; vertical-align: top;">
                    <div style="font-size: 11px; color: #64748B; font-weight: 700; text-transform: uppercase;">Volumen</div>
                    <div style="font-size: 20px; font-weight: 800; color: ${BRAND_NAVY}; margin-top: 2px;">
                      ${formattedM3} m³
                    </div>
                  </td>
                  <td width="16" style="font-size: 0; line-height: 0;">&nbsp;</td>
                  <td width="50%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px; vertical-align: top;">
                    <div style="font-size: 11px; color: #64748B; font-weight: 700; text-transform: uppercase;">Estimación</div>
                    <div style="font-size: 20px; font-weight: 800; color: ${BRAND_NAVY}; margin-top: 2px;">
                      ${formattedEstimate}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colspan="3" style="padding-top: 12px;">
                    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px 16px;">
                      <span style="font-size: 12px; color: #64748B; font-weight: 600;">Fecha solicitada:</span>
                      <strong style="font-size: 13px; color: ${BRAND_NAVY}; margin-left: 6px;">${dateFormatted}</strong>
                    </div>
                  </td>
                </tr>
              </table>

              ${notesHtml}

              <!-- CTA Button to Panel -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 28px;">
                <tr>
                  <td align="center">
                    <a href="${budgetLink}" 
                       style="display: inline-block; background-color: ${BRAND_NAVY}; color: ${BRAND_YELLOW}; border: 2px solid ${BRAND_YELLOW}; font-size: 15px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 31, 84, 0.25);">
                      👉 Abrir en el Panel de Operaciones
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 18px 32px; text-align: center; color: #94A3B8; font-size: 12px;">
              Notificación automática para operaciones · Transportes EP3
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Acknowledgment sent when the quote is submitted. No price, totals, or items. */
export function buildNewQuoteClientEmail(payload: NewQuoteEmailPayload): {
  to: string;
  subject: string;
  text: string;
  html: string;
} {
  const text = [
    "Cotización recibida",
    "",
    `Hola ${payload.clientName},`,
    "",
    "Recibimos tu solicitud. Nuestro equipo la está revisando y te enviaremos la cotización formal cuando esté lista.",
    "",
    "Este mensaje solo confirma que llegó tu solicitud. No incluye precio ni detalle de ítems.",
    "",
    "Si tienes dudas, escríbenos por WhatsApp o llama al +56 9 8489 8375.",
    "",
    "Saludos cordiales,",
    "Equipo de Transportes EP3",
    "https://www.transportesep3.cl",
  ].join("\n");

  return {
    to: payload.clientEmail.trim(),
    subject: NEW_QUOTE_CLIENT_SUBJECT,
    text,
    html: renderClientQuoteEmailHtml(payload),
  };
}

export function buildNewQuoteAdminEmail(
  payload: NewQuoteEmailPayload,
  adminRecipient: string,
): {
  to: string;
  subject: string;
  text: string;
  html: string;
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
    html: renderAdminQuoteEmailHtml(payload, adminRecipient),
  };
}

export async function notifyNewQuoteSubmitted(
  payload: NewQuoteEmailPayload,
): Promise<{
  clientResult: EmailDeliveryResult;
  adminResult: EmailDeliveryResult | null;
}> {
  const clientResult = await deliverEmail(buildNewQuoteClientEmail(payload));

  const adminEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.ADMIN_EMAIL ||
    "admin@transportesep3.cl";

  if (!adminEmail) {
    return { clientResult, adminResult: null };
  }

  const adminResult = await deliverEmail(
    buildNewQuoteAdminEmail(payload, adminEmail),
  );
  return { clientResult, adminResult };
}
