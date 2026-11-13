/**
 * Follow-up email notice for leads and clients.
 * Uses Resend via deliverEmail with branded EP3 styling (#001F54 navy, #FFCC00 yellow).
 */

import { deliverEmail, escapeHtml, type EmailDeliveryResult } from "./deliver";

export type FollowUpEmailPayload = {
  clientName: string;
  clientEmail: string;
  routeSummary?: string | null;
  estimatedAmount?: string | null;
  siteUrl?: string;
};

const BRAND_NAVY = "#001F54";
const BRAND_YELLOW = "#FFCC00";
const BRAND_KRAFT = "#c4863a";

export function buildFollowUpClientEmail(payload: FollowUpEmailPayload): {
  to: string;
  subject: string;
  text: string;
  html: string;
} {
  const to = payload.clientEmail.trim();
  const subject = "Seguimiento de tu cotización de mudanza — Transportes EP3";
  const routeLine = payload.routeSummary
    ? `• Trayecto: ${payload.routeSummary}`
    : "";
  const estimateLine = payload.estimatedAmount
    ? `• Estimación: ${payload.estimatedAmount}`
    : "";

  const text = [
    `Hola ${payload.clientName},`,
    "",
    "Te escribimos desde Transportes EP3 para dar seguimiento a tu solicitud de cotización de mudanza.",
    "",
    routeLine,
    estimateLine,
    "",
    "Queremos asegurarnos de que hayas recibido la información y resolver cualquier duda que tengas sobre la fecha, inventario o requerimientos de acceso.",
    "",
    "¿Pudiste revisar los detalles? Si deseas coordinar o ajustar la cotización, puedes responder directamente a este correo o contactarnos por WhatsApp al +56 9 8489 8375.",
    "",
    "Quedamos atentos para ayudarte,",
    "Equipo de Operaciones · Transportes EP3",
    "https://www.transportesep3.cl",
  ]
    .filter(Boolean)
    .join("\n");

  const routeBoxHtml = payload.routeSummary
    ? `<div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
         <div style="font-size: 11px; font-weight: 700; color: ${BRAND_KRAFT}; text-transform: uppercase;">Detalles de tu cotización</div>
         <div style="font-size: 14px; font-weight: 700; color: ${BRAND_NAVY}; margin-top: 4px;">${escapeHtml(payload.routeSummary)}</div>
         ${payload.estimatedAmount ? `<div style="font-size: 13px; color: #475569; margin-top: 4px;">Estimación: <strong>${escapeHtml(payload.estimatedAmount)}</strong></div>` : ""}
       </div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
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
            <td style="background-color: ${BRAND_NAVY}; padding: 28px 32px; text-align: left;">
              <div style="font-size: 24px; font-weight: 900; letter-spacing: 1.5px; color: #FFFFFF; text-transform: uppercase;">
                TRANSPORTES <span style="color: ${BRAND_YELLOW};">EP3</span>
              </div>
              <div style="font-size: 12px; color: #94A3B8; margin-top: 4px;">
                MUDANZAS &amp; LOGÍSTICA RESIDENCIAL
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 14px; font-size: 20px; color: ${BRAND_NAVY}; font-weight: 800;">
                ¡Hola ${escapeHtml(payload.clientName)}! 👋
              </h1>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #475569;">
                Te contactamos de Transportes EP3 para dar seguimiento a tu solicitud de cotización de mudanza.
              </p>

              ${routeBoxHtml}

              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
                Queremos asegurarnos de que hayas recibido la propuesta y ayudarte con cualquier duda respecto a fechas disponibles, inventario o requerimientos de tu edificio.
              </p>

              <!-- Actions -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <a href="https://wa.me/56984898375?text=Hola%20Transportes%20EP3,%20me%20comunico%20para%20coordinar%20mi%20mudanza" 
                       style="display: inline-block; background-color: #25D366; color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 2px 6px rgba(37, 211, 102, 0.3);">
                      💬 Responder por WhatsApp
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 14px;">
                    <a href="tel:+56984898375" style="font-size: 13px; color: ${BRAND_NAVY}; font-weight: 700; text-decoration: underline;">
                      O llamarnos al +56 9 8489 8375
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 32px; text-align: center; color: #64748B; font-size: 12px;">
              Transportes EP3 — Santiago, Chile · <a href="https://www.transportesep3.cl" style="color: ${BRAND_NAVY};">www.transportesep3.cl</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { to, subject, text, html };
}

export async function sendFollowUpEmail(
  payload: FollowUpEmailPayload,
): Promise<EmailDeliveryResult> {
  const emailData = buildFollowUpClientEmail(payload);
  return deliverEmail(emailData);
}
