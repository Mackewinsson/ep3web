import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(key);
}

export type JobAssignmentEmailPayload = {
  driverName: string;
  driverEmail: string;
  truckPlate: string;
  truckLabel?: string | null;
  clientName: string;
  originAddress: string;
  destinationAddress: string;
  scheduledDate?: string | null;
  notes?: string | null;
};

export async function sendDriverAssignmentEmail(
  payload: JobAssignmentEmailPayload,
) {
  const from = process.env.EMAIL_FROM ?? "Transportes EP3 <onboarding@resend.dev>";
  const resend = getResend();

  const dateLine = payload.scheduledDate
    ? `<p><strong>Fecha:</strong> ${payload.scheduledDate}</p>`
    : "";
  const notesLine = payload.notes
    ? `<p><strong>Notas:</strong> ${payload.notes}</p>`
    : "";
  const truckLine = payload.truckLabel
    ? `${payload.truckPlate} (${payload.truckLabel})`
    : payload.truckPlate;

  const { data, error } = await resend.emails.send({
    from,
    to: payload.driverEmail,
    subject: `Nueva mudanza asignada — ${payload.clientName}`,
    html: `
      <div style="font-family: sans-serif; color: #001F54;">
        <h1 style="color: #001F54;">Transportes EP3</h1>
        <p>Hola ${payload.driverName},</p>
        <p>Se te asignó un nuevo trabajo de mudanza.</p>
        <p><strong>Cliente:</strong> ${payload.clientName}</p>
        <p><strong>Origen:</strong> ${payload.originAddress}</p>
        <p><strong>Destino:</strong> ${payload.destinationAddress}</p>
        <p><strong>Camión:</strong> ${truckLine}</p>
        ${dateLine}
        ${notesLine}
        <p style="margin-top: 24px; color: #666;">— Equipo EP3</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
