import { stripClientPriceLines } from "@/lib/quote-pricing";
import { deliverEmail, type EmailDeliveryResult } from "./deliver";

export type JobAssignmentEmailPayload = {
  driverName: string;
  driverEmail: string | null;
  truckPlate?: string | null;
  truckLabel?: string | null;
  clientName: string;
  originAddress: string;
  destinationAddress: string;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  notes?: string | null;
};

export function buildDriverAssignmentEmail(payload: JobAssignmentEmailPayload): {
  to: string | null;
  subject: string;
  text: string;
} {
  const notes = stripClientPriceLines(payload.notes);
  const when = [payload.scheduledDate, payload.scheduledTime]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" · ");
  const truck = payload.truckPlate
    ? payload.truckLabel
      ? `${payload.truckPlate} (${payload.truckLabel})`
      : payload.truckPlate
    : "";
  const text = [
    `Hola ${payload.driverName},`,
    "Se te asignó un nuevo trabajo de mudanza.",
    `Cliente: ${payload.clientName}`,
    `Origen: ${payload.originAddress}`,
    `Destino: ${payload.destinationAddress}`,
    truck ? `Camión: ${truck}` : "",
    when ? `Fecha: ${when}` : "",
    notes ? `Notas: ${notes}` : "",
    "— Transportes EP3",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    to: payload.driverEmail?.trim() || null,
    subject: `Nueva mudanza asignada — ${payload.clientName}`,
    text,
  };
}

/** Operator notice. Omits the client total. Does not throw when Resend is unset. */
export async function sendDriverAssignmentEmail(
  payload: JobAssignmentEmailPayload,
): Promise<EmailDeliveryResult> {
  return deliverEmail(buildDriverAssignmentEmail(payload));
}
