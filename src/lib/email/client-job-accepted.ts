/**
 * Client job confirmation / driver acceptance notice.
 * Uses Resend when RESEND_API_KEY is set; otherwise logs a mock payload.
 * Emits branded HTML templates (#001F54 navy, #FFCC00 yellow, #c4863a kraft).
 */

import { deliverEmail, escapeHtml, type EmailDeliveryResult } from "./deliver";
import { formatDate } from "@/lib/format";

export type ClientJobAcceptedEmailPayload = {
  clientName: string;
  clientEmail: string | null;
  originAddress: string;
  destinationAddress: string;
  crewDriverName: string;
  crewDriverRut: string;
  truckPlate: string;
  truckLabel?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
};

export type ClientJobAcceptedEmailResult = EmailDeliveryResult;

export const CLIENT_JOB_ACCEPTED_SUBJECT =
  "¡Mudanza confirmada! Chofer y camión asignados — Transportes EP3";

const BRAND_NAVY = "#001F54";
const BRAND_YELLOW = "#FFCC00";
const BRAND_GREEN = "#047857";

export function clientJobAcceptedStatusCopy(
  clientEmail: string | null | undefined,
  outcome?: { failed?: boolean; error?: string | null } | null,
) {
  const to = clientEmail?.trim();
  if (!to) {
    return "El cliente no tiene correo; no se envió la confirmación con los datos del chofer.";
  }
  if (outcome?.failed) {
    return `No se pudo enviar la confirmación por correo a ${to}${outcome.error ? ` (${outcome.error})` : ""}.`;
  }
  return `Se envió la confirmación del servicio con datos del chofer al cliente (${to}).`;
}

function renderClientJobAcceptedHtml(
  payload: ClientJobAcceptedEmailPayload,
): string {
  const dateFormatted = payload.scheduledDate
    ? formatDate(payload.scheduledDate)
    : "Por coordinar";
  const timeFormatted = payload.scheduledTime
    ? `${payload.scheduledTime} hrs`
    : "Por coordinar";

  const truckText = payload.truckLabel
    ? `${escapeHtml(payload.truckPlate)} (${escapeHtml(payload.truckLabel)})`
    : escapeHtml(payload.truckPlate);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${CLIENT_JOB_ACCEPTED_SUBJECT}</title>
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
              <div style="display: inline-block; background-color: #D1FAE5; color: ${BRAND_GREEN}; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 12px; border-radius: 999px; margin-bottom: 16px;">
                ✓ Servicio Confirmado
              </div>
              <h1 style="margin: 0 0 12px; font-size: 22px; color: ${BRAND_NAVY}; font-weight: 800;">
                ¡Hola ${escapeHtml(payload.clientName)}!
              </h1>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
                ¡Excelentes noticias! Tu mudanza ha sido confirmada por nuestro equipo. A continuación te compartimos los datos del chofer y camión asignados para tu servicio:
              </p>

              <!-- Driver & Truck Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: ${BRAND_NAVY}; margin-bottom: 12px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">
                      Datos del Transporte
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #64748B; width: 130px; vertical-align: top;">Conductor</td>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: ${BRAND_NAVY};">${escapeHtml(payload.crewDriverName)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #64748B; width: 130px; vertical-align: top;">RUT Conductor</td>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: ${BRAND_NAVY};">${escapeHtml(payload.crewDriverRut)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #64748B; width: 130px; vertical-align: top;">Patente camión</td>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: ${BRAND_NAVY};">${truckText}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #64748B; width: 130px; vertical-align: top;">Fecha programada</td>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: ${BRAND_NAVY};">${escapeHtml(dateFormatted)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #64748B; width: 130px; vertical-align: top;">Hora estimada</td>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: ${BRAND_NAVY};">${escapeHtml(timeFormatted)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #64748B; width: 130px; vertical-align: top;">Origen</td>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: ${BRAND_NAVY};">${escapeHtml(payload.originAddress)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #64748B; width: 130px; vertical-align: top;">Destino</td>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: ${BRAND_NAVY};">${escapeHtml(payload.destinationAddress)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Notice info -->
              <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 14px 16px; border-radius: 4px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #1E40AF;">
                  <strong>Próximo paso:</strong> El día de tu servicio, cuando el camión inicie el recorrido hacia tu dirección, recibirás un correo avisándote que va en camino.
                </p>
              </div>

              <!-- Contact Buttons -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="https://wa.me/56984898375?text=Hola%20Transportes%20EP3,%20consulta%20sobre%20mi%20mudanza%20confirmada" 
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

export function buildClientJobAcceptedEmail(
  payload: ClientJobAcceptedEmailPayload,
): { to: string | null; subject: string; text: string; html: string } {
  const to = payload.clientEmail?.trim() || null;
  const dateFormatted = payload.scheduledDate
    ? formatDate(payload.scheduledDate)
    : "Por coordinar";
  const timeFormatted = payload.scheduledTime
    ? `${payload.scheduledTime} hrs`
    : "Por coordinar";

  const truckText = payload.truckLabel
    ? `${payload.truckPlate} (${payload.truckLabel})`
    : payload.truckPlate;

  const text = [
    `Hola ${payload.clientName},`,
    "¡Tu mudanza ha sido confirmada!",
    `Conductor: ${payload.crewDriverName}`,
    `RUT: ${payload.crewDriverRut}`,
    `Camión: ${truckText}`,
    `Fecha programada: ${dateFormatted}`,
    `Hora estimada: ${timeFormatted}`,
    `Origen: ${payload.originAddress}`,
    `Destino: ${payload.destinationAddress}`,
    "",
    "El día del servicio recibirás una notificación cuando el camión vaya en camino.",
    "— Transportes EP3",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    to,
    subject: CLIENT_JOB_ACCEPTED_SUBJECT,
    text,
    html: renderClientJobAcceptedHtml(payload),
  };
}

export async function notifyClientJobAccepted(
  payload: ClientJobAcceptedEmailPayload,
): Promise<ClientJobAcceptedEmailResult> {
  return deliverEmail(buildClientJobAcceptedEmail(payload));
}
