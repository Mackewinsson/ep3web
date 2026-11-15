/**
 * Admin notice when a person submits a quote.
 * The client is not emailed at this step.
 */

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { staffUsers } from "@/db/schema";
import { deliverEmail, type EmailDeliveryResult } from "./deliver";

export type AdminNewQuoteEmailPayload = {
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  originAddress: string;
  destinationAddress: string;
  summary?: string | null;
  href: string;
};

export function adminQuotePanelUrl(href: string) {
  if (/^https?:\/\//i.test(href)) return href;
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const path = href.startsWith("/") ? href : `/${href}`;
  return base ? `${base}${path}` : path;
}

export function buildAdminNewQuoteEmail(payload: AdminNewQuoteEmailPayload): {
  subject: string;
  text: string;
} {
  const contact = [payload.clientEmail?.trim(), payload.clientPhone?.trim()]
    .filter(Boolean)
    .join(" · ");
  const text = [
    "Llegó una nueva cotización desde el sitio web.",
    `Cliente: ${payload.clientName}`,
    contact ? `Contacto: ${contact}` : "",
    `Origen: ${payload.originAddress}`,
    `Destino: ${payload.destinationAddress}`,
    payload.summary?.trim() ? payload.summary.trim() : "",
    "El cliente todavía no recibe este correo. Se le envía la cotización cuando el presupuesto se aprueba.",
    `Revisar: ${adminQuotePanelUrl(payload.href)}`,
    "— Transportes EP3",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `Nueva cotización — ${payload.clientName}`,
    text,
  };
}

/** One message per active admin. Does not throw when Resend is unset. */
export async function emailAdminsAboutNewQuote(
  payload: AdminNewQuoteEmailPayload,
): Promise<EmailDeliveryResult[]> {
  const admins = await db
    .select({ email: staffUsers.email })
    .from(staffUsers)
    .where(and(eq(staffUsers.role, "admin"), eq(staffUsers.active, true)));

  const email = buildAdminNewQuoteEmail(payload);
  if (!admins.length) {
    return [await deliverEmail({ to: null, subject: email.subject, text: email.text })];
  }

  const results: EmailDeliveryResult[] = [];
  for (const admin of admins) {
    results.push(
      await deliverEmail({
        to: admin.email,
        subject: email.subject,
        text: email.text,
      }),
    );
  }
  return results;
}
