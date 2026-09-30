import { Resend } from "resend";

/** Sandbox sender. Delivers only to the Resend account owner until a domain is verified. */
export const DEFAULT_EMAIL_FROM =
  "Transportes EP3 <onboarding@resend.dev>";

export type EmailDeliveryResult = {
  mocked: boolean;
  skipped: boolean;
  failed: boolean;
  to: string | null;
  subject: string;
  error: string | null;
};

export type EmailNoticeKind = "quote" | "en_camino" | "assignment";

const NOTICE_TYPE: Record<EmailNoticeKind, string> = {
  quote: "quote_email",
  en_camino: "client_en_camino_email",
  assignment: "assignment_email",
};

const NOTICE_TITLE: Record<
  EmailNoticeKind,
  { skipped: string; failed: string; mocked: string; sent: string }
> = {
  quote: {
    skipped: "Cotización — cliente sin correo",
    failed: "Cotización — correo no enviado",
    mocked: "Cotización — aviso al cliente (simulado)",
    sent: "Cotización enviada al cliente",
  },
  en_camino: {
    skipped: "En camino — cliente sin correo (aviso no enviado)",
    failed: "En camino — aviso al cliente no enviado",
    mocked: "En camino — aviso al cliente (simulado)",
    sent: "En camino — aviso enviado al cliente",
  },
  assignment: {
    skipped: "Asignación — operador sin correo",
    failed: "Asignación — correo no enviado",
    mocked: "Asignación — correo al operador (simulado)",
    sent: "Asignación — correo enviado al operador",
  },
};

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function textToHtml(text: string) {
  return `<div style="font-family: sans-serif; color: #001F54;">${escapeHtml(text).replace(/\n/g, "<br/>")}</div>`;
}

/**
 * Sends through Resend when RESEND_API_KEY is set.
 * Without a key, logs the payload and returns mocked (workflow may continue).
 * Never throws for a missing key or a provider error.
 */
export async function deliverEmail(email: {
  to: string | null;
  subject: string;
  text: string;
}): Promise<EmailDeliveryResult> {
  const to = email.to?.trim() || null;
  if (!to) {
    console.info("[email:mock] skipped (no email)", { subject: email.subject });
    return {
      mocked: true,
      skipped: true,
      failed: false,
      to: null,
      subject: email.subject,
      error: null,
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info("[email:mock]", {
      to,
      subject: email.subject,
      text: email.text,
    });
    return {
      mocked: true,
      skipped: false,
      failed: false,
      to,
      subject: email.subject,
      error: null,
    };
  }

  try {
    const resend = new Resend(apiKey);
    const from = process.env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM;
    const { error } = await resend.emails.send({
      from,
      to,
      subject: email.subject,
      text: email.text,
      html: textToHtml(email.text),
    });
    if (error) {
      console.error("[email] failed", error.message);
      return {
        mocked: false,
        skipped: false,
        failed: true,
        to,
        subject: email.subject,
        error: error.message,
      };
    }
    return {
      mocked: false,
      skipped: false,
      failed: false,
      to,
      subject: email.subject,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al enviar correo";
    console.error("[email] failed", err);
    return {
      mocked: false,
      skipped: false,
      failed: true,
      to,
      subject: email.subject,
      error: message,
    };
  }
}

/** Mock or real send that had a recipient and did not fail. */
export function emailWasDelivered(result: EmailDeliveryResult) {
  return !result.skipped && !result.failed;
}

/** Resend accepted the message. A mock does not count. */
export function emailWasSent(result: EmailDeliveryResult) {
  return emailWasDelivered(result) && !result.mocked;
}

export function emailDeliveryNotice(
  kind: EmailNoticeKind,
  result: Pick<EmailDeliveryResult, "mocked" | "skipped" | "failed" | "to" | "error">,
  detail: string,
) {
  const titles = NOTICE_TITLE[kind];
  const title = result.skipped
    ? titles.skipped
    : result.failed
      ? titles.failed
      : result.mocked
        ? titles.mocked
        : titles.sent;

  let body = detail;
  if (result.failed && result.error) {
    body = `${detail} · ${result.error}`;
  } else if (!result.skipped && !result.failed && result.mocked) {
    body = `Mock a ${result.to}: ${detail}`;
  } else if (!result.skipped && !result.failed) {
    body = `Enviado a ${result.to}: ${detail}`;
  }

  return { type: NOTICE_TYPE[kind], title, body };
}

export function quoteEmailBlockedReason(result: EmailDeliveryResult) {
  if (result.skipped) return "sin-correo" as const;
  if (result.failed) return "fallo" as const;
  return null;
}
