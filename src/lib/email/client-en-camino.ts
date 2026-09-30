/**
 * Client “en camino” notice.
 * Uses Resend when RESEND_API_KEY is set; otherwise logs a mock payload.
 */

import { deliverEmail, type EmailDeliveryResult } from "./deliver";

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

export function clientEnCaminoStatusCopy(clientEmail: string | null | undefined) {
  const to = clientEmail?.trim();
  if (!to) {
    return "El cliente no tiene correo; no se envió el aviso de que la mudanza va en camino.";
  }
  return `Se avisó al cliente por correo (${to}) de que su mudanza va en camino.`;
}

export function buildClientEnCaminoEmail(
  payload: ClientEnCaminoEmailPayload,
): { to: string | null; subject: string; text: string } {
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

  return { to, subject: CLIENT_EN_CAMINO_SUBJECT, text };
}

export async function notifyClientEnCamino(
  payload: ClientEnCaminoEmailPayload,
): Promise<ClientEnCaminoEmailResult> {
  return deliverEmail(buildClientEnCaminoEmail(payload));
}
