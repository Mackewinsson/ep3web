/**
 * The wizard writes a single block of labelled lines into the quote notes.
 * Some of those lines are now shown by the item table (inventory, boxes,
 * charges, the auto estimate), while others are the only record we keep of
 * what the client answered (access, helpers, fragile items, preferred time).
 *
 * These helpers split that block so the UI can show each part where it
 * belongs. They are pure string functions: the notes text itself is still the
 * machine-readable snapshot and is not rewritten here.
 */

/** Labels whose content the item table already shows. */
const GENERATED_LABELS = [
  "Inventario",
  "Cajas",
  "Cargos",
  "Estimación auto",
  "Estimacion auto",
] as const;

/** Labels that only exist in the notes text, in the order we display them. */
const SERVICE_LABELS = [
  "Origen",
  "Destino",
  "Ayudantes",
  "Delicados",
  "Hora preferida",
  "Notas cliente",
] as const;

export type ServiceDetail = { label: string; value: string };

export type NotesSections = {
  /** Client answers that live nowhere else, in wizard order. */
  service: ServiceDetail[];
  /** Anything the admin typed that is not one of the labelled lines. */
  freeText: string;
};

function labelPattern(labels: readonly string[]) {
  const escaped = labels.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`^(${escaped.join("|")})\\s*:\\s*(.*)$`, "i");
}

const GENERATED_RE = labelPattern(GENERATED_LABELS);
const SERVICE_RE = labelPattern(SERVICE_LABELS);
const INVENTARIO_RE = /^Inventario\s*:/i;

function canonicalServiceLabel(raw: string) {
  const found = SERVICE_LABELS.find(
    (label) => label.toLowerCase() === raw.trim().toLowerCase(),
  );
  return found ?? raw.trim();
}

/**
 * Splits notes into the service context and whatever free text remains.
 *
 * Only `Inventario:` wraps onto following lines, so that is the single case
 * where an unlabelled line is treated as a continuation. Every other
 * unlabelled line is kept as free text — dropping it could silently discard
 * something the admin wrote.
 */
export function parseNotesSections(
  notes: string | null | undefined,
): NotesSections {
  const service: ServiceDetail[] = [];
  const free: string[] = [];
  if (!notes) return { service, freeText: "" };

  let inInventario = false;

  for (const line of notes.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed) {
      inInventario = false;
      free.push("");
      continue;
    }

    const serviceMatch = trimmed.match(SERVICE_RE);
    if (serviceMatch) {
      inInventario = false;
      const value = serviceMatch[2].trim();
      if (value) {
        service.push({ label: canonicalServiceLabel(serviceMatch[1]), value });
      }
      continue;
    }

    if (GENERATED_RE.test(trimmed)) {
      inInventario = INVENTARIO_RE.test(trimmed);
      continue;
    }

    if (inInventario) continue;

    free.push(line);
  }

  const freeText = free
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { service, freeText };
}

/** The client answers, for the read-only «Detalles del servicio» panel. */
export function serviceDetailsFromNotes(notes: string | null | undefined) {
  return parseNotesSections(notes).service;
}

/**
 * What the admin actually wrote, with the wizard's labelled lines removed.
 * Used to turn a legacy `budgets.notes` dump into a client message.
 */
export function clientMessageFromNotes(notes: string | null | undefined) {
  return parseNotesSections(notes).freeText;
}
