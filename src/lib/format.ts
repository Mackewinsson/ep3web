export function formatClp(amount: string | number) {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Numeric DB values in editable inputs: `3.00` → `3`, `3.50` → `3.5`. */
export function trimDecimals(value: string | number | null | undefined) {
  if (value == null || value === "") return "";
  const text = String(value).trim();
  if (!/^-?\d+(\.\d+)?$/.test(text)) return text;
  return text.includes(".")
    ? text.replace(/\.?0+$/, "") || "0"
    : text;
}

/** Shown on client quotes: stored totals are net; IVA is added later. */
export const CLIENT_PRICE_IVA_SUFFIX = "+ IVA";

export function formatClpPlusIva(amount: string | number) {
  const formatted = formatClp(amount);
  if (formatted === "—") return formatted;
  return `${formatted} ${CLIENT_PRICE_IVA_SUFFIX}`;
}

export function formatClientPackagePrice(
  amount: string | number,
  pricingType: "fixed" | "m3" | "unit",
) {
  const formatted = formatClp(amount);
  if (formatted === "—") return formatted;
  if (pricingType === "m3") {
    return `${formatted} / m³ ${CLIENT_PRICE_IVA_SUFFIX}`;
  }
  if (pricingType === "unit") {
    return `${formatted} / unidad ${CLIENT_PRICE_IVA_SUFFIX}`;
  }
  return `${formatted} ${CLIENT_PRICE_IVA_SUFFIX}`;
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
  in_progress: "En camino",
  completed: "Finalizado",
  cancelled: "Cancelado",
};

export const DRIVER_JOB_STATUS_LABELS: Record<string, string> = {
  assigned: "Por iniciar",
  in_progress: "En camino",
  completed: "Finalizado",
  cancelled: "Cancelado",
};

export const ASSIGNMENT_END_REASON_LABELS: Record<string, string> = {
  declined: "Rechazado",
  reassigned: "Reasignado",
  cancelled: "Cancelado",
};

export type StatusTone =
  | "default"
  | "info"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "muted";

export function jobStatusTone(status: string): StatusTone {
  switch (status) {
    case "pending_assignment":
      return "warning";
    case "assigned":
      return "info";
    case "in_progress":
      return "accent";
    case "completed":
      return "success";
    case "cancelled":
      return "danger";
    default:
      return "default";
  }
}

/** Admin-facing badge: split `assigned` into waiting vs accepted by the operator. */
export function adminJobBadge(
  status: string,
  accepted: boolean,
): { label: string; tone: StatusTone } {
  if (status === "assigned") {
    return accepted
      ? { label: "Aceptado", tone: "success" }
      : { label: "Por aceptar", tone: "warning" };
  }
  return {
    label: JOB_STATUS_LABELS[status] ?? status,
    tone: jobStatusTone(status),
  };
}

/** Operator-facing badge: waiting to accept vs ready to go en camino. */
export function driverJobBadge(
  status: string,
  accepted: boolean,
): { label: string; tone: StatusTone } {
  if (status === "assigned") {
    return accepted
      ? { label: "Por iniciar", tone: "info" }
      : { label: "Por aceptar", tone: "warning" };
  }
  return {
    label: DRIVER_JOB_STATUS_LABELS[status] ?? status,
    tone: jobStatusTone(status),
  };
}

export function quoteStatusTone(status: string): StatusTone {
  switch (status) {
    case "new":
      return "accent";
    case "in_progress":
      return "info";
    case "converted":
      return "success";
    case "closed":
      return "muted";
    default:
      return "default";
  }
}

export function budgetStatusTone(status: string): StatusTone {
  switch (status) {
    case "draft":
      return "muted";
    case "sent":
      return "warning";
    case "approved":
      return "success";
    case "rejected":
    case "expired":
      return "danger";
    default:
      return "default";
  }
}

export const PRICING_UNIT_LABELS: Record<string, string> = {
  fixed: "Precio fijo",
  m3: "Por m³",
  unit: "Por unidad",
};

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 140);
}
