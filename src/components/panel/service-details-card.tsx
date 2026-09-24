import { serviceDetailsFromNotes } from "@/lib/quote-pricing";

/**
 * What the client answered in the wizard: access, helpers, fragile items and
 * timing. These only exist inside the notes text, so they are shown read-only
 * here instead of being mixed into the message written to the client.
 */
export function ServiceDetailsCard({ notes }: { notes: string | null }) {
  const details = serviceDetailsFromNotes(notes);
  if (!details.length) return null;

  return (
    <section className="panel-card p-4 md:p-5">
      <h2 className="font-semibold text-ep3-navy">Detalles del servicio</h2>
      <p className="mt-1 text-sm text-ep3-navy/60">
        Lo que respondió el cliente en el cotizador. Los ítems y el volumen
        están en la tabla.
      </p>
      <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {details.map((detail) => (
          <div key={detail.label}>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-ep3-navy/50">
              {detail.label}
            </dt>
            <dd className="mt-0.5 text-sm text-ep3-navy">{detail.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
