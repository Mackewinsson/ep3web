/** Helpers for truck legal document vigencies (permiso, SOAP, RT). */

export type DocExpiryTone = "ok" | "soon" | "expired" | "missing";

const SOON_DAYS = 30;

function parseDateOnly(value: string): Date {
  // Noon local avoids off-by-one vs UTC midnight for YYYY-MM-DD
  return new Date(`${value}T12:00:00`);
}

export function docExpiryStatus(
  expiresAt: string | null | undefined,
  soonDays = SOON_DAYS,
): DocExpiryTone {
  if (!expiresAt) return "missing";
  const end = parseDateOnly(expiresAt);
  if (Number.isNaN(end.getTime())) return "missing";

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  if (end.getTime() < today.getTime()) return "expired";

  const soon = new Date(today);
  soon.setDate(soon.getDate() + soonDays);
  if (end.getTime() <= soon.getTime()) return "soon";

  return "ok";
}

export function docExpiryLabel(tone: DocExpiryTone): string {
  switch (tone) {
    case "expired":
      return "Vencido";
    case "soon":
      return "Por vencer";
    case "missing":
      return "Sin dato";
    default:
      return "Vigente";
  }
}

export function worstTruckDocTone(truck: {
  permisoCirculacionExpiresAt: string | null;
  soapExpiresAt: string | null;
  revisionTecnicaExpiresAt: string | null;
}): DocExpiryTone {
  const tones = [
    docExpiryStatus(truck.permisoCirculacionExpiresAt),
    docExpiryStatus(truck.soapExpiresAt),
    docExpiryStatus(truck.revisionTecnicaExpiresAt),
  ];
  if (tones.includes("expired")) return "expired";
  if (tones.includes("missing")) return "missing";
  if (tones.includes("soon")) return "soon";
  return "ok";
}

export function expiryToneToBadge(
  tone: DocExpiryTone,
): "success" | "warning" | "danger" | "muted" {
  switch (tone) {
    case "ok":
      return "success";
    case "soon":
      return "warning";
    case "expired":
      return "danger";
    default:
      return "muted";
  }
}
