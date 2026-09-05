import { stripClientPriceLines } from "@/lib/quote-pricing";

export type OperatorServiceNotes = {
  originAccess: string | null;
  destinationAccess: string | null;
  helpers: string | null;
  fragile: string | null;
  inventoryItems: string[];
  boxes: string | null;
  preferredTime: string | null;
  clientNotes: string | null;
  extraLines: string | null;
};

const LINE_PREFIXES = {
  origin: /^origen:\s*/i,
  destination: /^destino:\s*/i,
  helpers: /^ayudantes:\s*/i,
  fragile: /^delicados:\s*/i,
  inventory: /^inventario:\s*/i,
  boxes: /^cajas:\s*/i,
  preferredTime: /^hora preferida:\s*/i,
  clientNotes: /^notas cliente:\s*/i,
} as const;

function uniqueLines(...blocks: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const block of blocks) {
    if (!block) continue;
    for (const raw of block.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      const key = line.replace(/\s+/g, " ").toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(line);
    }
  }
  return lines;
}

function takePrefixed(
  lines: string[],
  prefix: RegExp,
): { value: string | null; rest: string[] } {
  const rest: string[] = [];
  let value: string | null = null;
  for (const line of lines) {
    if (value == null && prefix.test(line)) {
      const next = line.replace(prefix, "").trim();
      value = next && next !== "—" ? next : null;
      continue;
    }
    rest.push(line);
  }
  return { value, rest };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Keep property type / parking / floor; drop the street already shown on the map card. */
export function accessExtrasWithoutAddress(
  sideValue: string | null,
  address?: string | null,
): string | null {
  if (!sideValue) return null;
  let text = sideValue.trim();
  if (address?.trim()) {
    const escaped = escapeRegExp(address.trim());
    text = text.replace(new RegExp(`\\s*[—–-]\\s*${escaped}`, "i"), "");
    text = text.replace(new RegExp(escaped, "i"), "");
  }
  text = text
    .replace(/^\s*·\s*/, "")
    .replace(/\s*·\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*·\s*/g, " · ")
    .trim();
  return text || null;
}

function inventoryList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/\s*,\s*/)
    .map((item) => item.trim())
    .filter((item) => item && item !== "—");
}

export function buildOperatorServiceNotes(
  volumeNotes: string | null | undefined,
  jobNotes: string | null | undefined,
  opts?: {
    scheduledTime?: string | null;
    originAddress?: string | null;
    destinationAddress?: string | null;
  },
): OperatorServiceNotes {
  const lines = uniqueLines(
    stripClientPriceLines(volumeNotes),
    stripClientPriceLines(jobNotes),
  );

  let rest = lines;
  let originRaw: string | null;
  let destRaw: string | null;
  let helpers: string | null;
  let fragile: string | null;
  let inventoryRaw: string | null;
  let boxes: string | null;
  let preferredTime: string | null;
  let clientNotes: string | null;

  ({ value: originRaw, rest } = takePrefixed(rest, LINE_PREFIXES.origin));
  ({ value: destRaw, rest } = takePrefixed(rest, LINE_PREFIXES.destination));
  ({ value: helpers, rest } = takePrefixed(rest, LINE_PREFIXES.helpers));
  ({ value: fragile, rest } = takePrefixed(rest, LINE_PREFIXES.fragile));
  ({ value: inventoryRaw, rest } = takePrefixed(rest, LINE_PREFIXES.inventory));
  ({ value: boxes, rest } = takePrefixed(rest, LINE_PREFIXES.boxes));
  ({ value: preferredTime, rest } = takePrefixed(
    rest,
    LINE_PREFIXES.preferredTime,
  ));
  ({ value: clientNotes, rest } = takePrefixed(rest, LINE_PREFIXES.clientNotes));

  if (opts?.scheduledTime?.trim()) {
    preferredTime = null;
  }

  return {
    originAccess: accessExtrasWithoutAddress(originRaw, opts?.originAddress),
    destinationAccess: accessExtrasWithoutAddress(
      destRaw,
      opts?.destinationAddress,
    ),
    helpers,
    fragile,
    inventoryItems: inventoryList(inventoryRaw),
    boxes,
    preferredTime,
    clientNotes,
    extraLines: rest.length ? rest.join("\n") : null,
  };
}

export function operatorServiceNotesAreEmpty(notes: OperatorServiceNotes) {
  return (
    !notes.helpers &&
    !notes.fragile &&
    notes.inventoryItems.length === 0 &&
    !notes.boxes &&
    !notes.preferredTime &&
    !notes.clientNotes &&
    !notes.extraLines
  );
}
