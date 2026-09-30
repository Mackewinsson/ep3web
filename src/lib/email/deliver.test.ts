import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deliverEmail,
  emailDeliveryNotice,
  emailWasDelivered,
  emailWasSent,
  escapeHtml,
  quoteEmailBlockedReason,
  textToHtml,
} from "./deliver";

describe("escapeHtml", () => {
  it("escapes markup before it is placed in HTML", () => {
    assert.equal(escapeHtml(`<script>"&"</script>`), "&lt;script&gt;&quot;&amp;&quot;&lt;/script&gt;");
    assert.doesNotMatch(textToHtml("Hola\n<script>"), /<script>/);
    assert.match(textToHtml("Hola\nmundo"), /Hola<br\/>mundo/);
  });
});

describe("email delivery result", () => {
  it("treats a mock as delivered for the workflow, not as a real send", async () => {
    const previous = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    try {
      const result = await deliverEmail({
        to: "ana@example.com",
        subject: "Hola",
        text: "Cuerpo",
      });
      assert.equal(result.mocked, true);
      assert.equal(result.failed, false);
      assert.equal(emailWasDelivered(result), true);
      assert.equal(emailWasSent(result), false);
      assert.equal(quoteEmailBlockedReason(result), null);
    } finally {
      if (previous === undefined) delete process.env.RESEND_API_KEY;
      else process.env.RESEND_API_KEY = previous;
    }
  });

  it("skips when there is no recipient", async () => {
    const result = await deliverEmail({
      to: "  ",
      subject: "Hola",
      text: "Cuerpo",
    });
    assert.equal(result.skipped, true);
    assert.equal(emailWasDelivered(result), false);
    assert.equal(quoteEmailBlockedReason(result), "sin-correo");
  });
});

describe("emailDeliveryNotice", () => {
  it("labels quote, en camino, and assignment outcomes", () => {
    const skipped = emailDeliveryNotice(
      "quote",
      { mocked: true, skipped: true, failed: false, to: null, error: null },
      "Mudanza",
    );
    assert.equal(skipped.type, "quote_email");
    assert.match(skipped.title, /sin correo/);
    assert.equal(skipped.body, "Mudanza");

    const mocked = emailDeliveryNotice(
      "en_camino",
      {
        mocked: true,
        skipped: false,
        failed: false,
        to: "ana@example.com",
        error: null,
      },
      "Ana: A → B",
    );
    assert.equal(mocked.type, "client_en_camino_email");
    assert.match(mocked.title, /simulado/);
    assert.match(mocked.body, /Mock a ana@example.com/);

    const sent = emailDeliveryNotice(
      "assignment",
      {
        mocked: false,
        skipped: false,
        failed: false,
        to: "op@example.com",
        error: null,
      },
      "Operador: A → B",
    );
    assert.equal(sent.type, "assignment_email");
    assert.match(sent.title, /enviado al operador/i);
    assert.match(sent.body, /Enviado a op@example.com/);

    const failed = emailDeliveryNotice(
      "quote",
      {
        mocked: false,
        skipped: false,
        failed: true,
        to: "ana@example.com",
        error: "invalid",
      },
      "Mudanza",
    );
    assert.match(failed.title, /no enviado/);
    assert.match(failed.body, /invalid/);
  });
});
