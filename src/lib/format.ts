export function formatClp(amount: string | number) {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  new: "Nueva",
  in_progress: "En gestión",
  converted: "Convertida",
  closed: "Cerrada",
};

export const BUDGET_STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviado",
  approved: "Aprobado",
  rejected: "Rechazado",
  expired: "Expirado",
};

export const JOB_STATUS_LABELS: Record<string, string> = {
  pending_assignment: "Sin conductor",
  assigned: "Asignado",
  in_progress: "En curso",
  completed: "Completado",
  cancelled: "Cancelado",
};
