/**
 * Client “en camino” notice.
 * Uses Resend when RESEND_API_KEY is set; otherwise logs a mock payload.
 * Emits branded HTML templates (#001F54 navy, #FFCC00 yellow, #c4863a kraft).
 */

import { deliverEmail, escapeHtml, type EmailDeliveryResult } from "./deliver";

export type ClientEnCaminoEmailPayload = {
  clientName: string;
  clientEmail: string | null;
  originAddress: string;
  destinationAddress: string;
  crewDriverName?: string | null;
  truckPlate?: string | null;
};

export type ClientEnCaminoEmailResult = EmailDeliveryResult;

export const CLIENT_EN_CAMINO_SUBJECT =
  "Tu mudanza va en camino — Transportes EP3";

export const CLIENT_EN_CAMINO_CONFIRM_HINT =
  "Al confirmar se avisa al cliente por correo.";

const BRAND_NAVY = "#001F54";
const BRAND_YELLOW = "#FFCC00";
const BRAND_KRAFT = "#c4863a";

export function clientEnCaminoStatusCopy(
  clientEmail: string | null | undefined,
  outcome?: { failed?: boolean; error?: string | null } | null,
) {
  const to = clientEmail?.trim();
  if (!to) {
    return "El cliente no tiene correo; no se envió el aviso de que la mudanza va en camino.";
  }
  if (outcome?.failed) {
    return `No se pudo enviar el aviso por correo a ${to}${outcome.error ? ` (${outcome.error})` : ""}.`;
  }
  return `Se avisó al cliente por correo (${to}) de que su mudanza va en camino.`;
}

function renderClientEnCaminoHtml(payload: ClientEnCaminoEmailPayload): string {
  const crewRow = payload.crewDriverName
    ? `<tr>
        <td style="padding: 8px 0; font-size: 14px; color: #64748B; width: 110px;">Conductor</td>
        <td style="padding: 8px 0; font-size: 14px; font-weight: 700; color: ${BRAND_NAVY};">${escapeHtml(payload.crewDriverName)}</td>
      </tr>`
    : "";
  const truckRow = payload.truckPlate
    ? `<tr>
        <td style="padding: 8px 0; font-size: 14px; color: #64748B; width: 110px;">Patente camión</td>
        <td style="padding: 8px 0; font-size: 14px; font-weight: 700; color: ${BRAND_NAVY};">${escapeHtml(payload.truckPlate)}</td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu mudanza va en camino — Transportes EP3</title>
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
              <div style="display: inline-block; background-color: #FEF3C7; color: ${BRAND_KRAFT}; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 12px; border-radius: 999px; margin-bottom: 16px;">
                🚚 En camino
              </div>
              <h1 style="margin: 0 0 12px; font-size: 22px; color: ${BRAND_NAVY}; font-weight: 800;">
                ¡Hola ${escapeHtml(payload.clientName)}!
              </h1>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
                Te informamos que nuestro equipo ya salió y <strong>tu mudanza va en camino</strong>.
              </p>

              <!-- Route & Crew Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #64748B; width: 110px; vertical-align: top;">Origen</td>
                        <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: ${BRAND_NAVY};">${escapeHtml(payload.originAddress)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #64748B; width: 110px; vertical-align: top;">Destino</td>
                        <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: ${BRAND_NAVY};">${escapeHtml(payload.destinationAddress)}</td>
                      </tr>
                      ${crewRow}
                      ${truckRow}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Contact Buttons -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="https://wa.me/56984898375?text=Hola%20Transportes%20EP3,%20consulta%20sobre%20mi%20mudanza%20en%20camino" 
                       style="display: inline-block; background-color: #25D366; color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 2px 6px rgba(37, 211, 102, 0.3);">
                      💬 Contactar por WhatsApp
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 14px;">
                    <a href="tel:+56984898375" style="font-size: 13px; color: ${BRAND_NAVY}; font-weight: 700; text-decoration: underline;">
                      O llámanos al +56 9 8489 8375
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

export function buildClientEnCaminoEmail(
  payload: ClientEnCaminoEmailPayload,
): { to: string | null; subject: string; text: string; html: string } {
  const to = payload.clientEmail?.trim() || null;
  const crew = payload.crewDriverName
    ? `Conductor: ${payload.crewDriverName}.`
    : "";
  const truck = payload.truckPlate ? `Camión: ${payload.truckPlate}.` : "";
  const text = [
    `Hola ${payload.clientName},`,
    "Tu mudanza ya va en camino.",
    `Origen: ${payload.originAddress}`,
    `Destino: ${payload.destinationAddress}`,
    crew,
    truck,
    "— Transportes EP3",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    to,
    subject: CLIENT_EN_CAMINO_SUBJECT,
    text,
    html: renderClientEnCaminoHtml(payload),
  };
}

export async function notifyClientEnCamino(
  payload: ClientEnCaminoEmailPayload,
): Promise<ClientEnCaminoEmailResult> {
  return deliverEmail(buildClientEnCaminoEmail(payload));
}
