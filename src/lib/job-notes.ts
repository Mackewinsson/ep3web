import { stripClientPriceLines } from "@/lib/quote-pricing";

export function notesContentEqual(a?: string | null, b?: string | null) {
  return (
    (a ?? "").replace(/\s+/g, " ").trim() ===
    (b ?? "").replace(/\s+/g, " ").trim()
  );
}

function isVolumeCopy(jobNotes: string, volumeNotes?: string | null) {
  if (notesContentEqual(jobNotes, volumeNotes)) return true;
  return notesContentEqual(
    stripClientPriceLines(jobNotes),
    stripClientPriceLines(volumeNotes),
  );
}

/** Job notes for display/edit: hide copies of volume details. */
export function operationalJobNotes(
  jobNotes?: string | null,
  volumeNotes?: string | null,
) {
  const trimmed = jobNotes?.trim() || "";
  if (!trimmed) return null;
  if (isVolumeCopy(trimmed, volumeNotes)) return null;
  return jobNotes;
}
