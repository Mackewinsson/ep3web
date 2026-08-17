/**
 * Client “en camino” notice.
 * Real Resend delivery is not wired yet — always logs a mock payload.
 */

export type ClientEnCaminoEmailPayload = {
  clientName: string;
  clientEmail: string | null;
  originAddress: string;
  destinationAddress: string;
  crewDriverName?: string | null;
  truckPlate?: string | null;
};

export type ClientEnCaminoEmailResult = {
  mocked: true;
  skipped: boolean;
  to: string | null;
  subject: string;
};

export const CLIENT_EN_CAMINO_SUBJECT =
  "Tu mudanza va en camino — Transportes EP3";

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
  const email = buildClientEnCaminoEmail(payload);
  const skipped = !email.to;

  console.info("[email:mock] client en camino", {
    to: email.to,
    subject: email.subject,
    skipped,
    text: email.text,
  });

  return {
    mocked: true,
    skipped,
    to: email.to,
    subject: email.subject,
  };
}
