import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildNewQuoteAdminEmail,
  buildNewQuoteClientEmail,
  NEW_QUOTE_CLIENT_SUBJECT,
  notifyNewQuoteSubmitted,
} from "./new-quote";

describe("buildNewQuoteClientEmail", () => {
  it("acknowledges the request with no price, totals, or item details", () => {
    const email = buildNewQuoteClientEmail({
      quoteId: "q-123",
      clientName: "Carolina Gómez",
      clientEmail: "carolina@example.com",
      clientPhone: "+56912345678",
      originAddress: "Providencia 123",
      destinationAddress: "Las Condes 456",
      totalM3: 15.5,
      estimatedAmount: 350000,
      preferredDate: "2026-12-01",
      preferredTime: "10:00",
      notes: "Sofá de 3 cuerpos",
    });

    assert.equal(email.to, "carolina@example.com");
    assert.equal(email.subject, NEW_QUOTE_CLIENT_SUBJECT);
    assert.match(email.subject, /Cotización recibida/);
    assert.match(email.text, /Cotización recibida/);
    assert.match(email.text, /Hola Carolina Gómez,/);
    assert.match(email.text, /Recibimos tu solicitud/);
    assert.doesNotMatch(email.text, /Providencia/);
    assert.doesNotMatch(email.text, /Las Condes/);
    assert.doesNotMatch(email.text, /Sofá/);
    assert.doesNotMatch(email.text, /15\.5/);
    assert.doesNotMatch(email.text, /m³/);
    assert.doesNotMatch(email.text, /IVA/);
    assert.doesNotMatch(email.text, /\$/);
    assert.doesNotMatch(email.text, /2026-12-01/);

    assert.match(email.html, /#001F54/);
    assert.match(email.html, /#FFCC00/);
    assert.match(email.html, /TRANSPORTES/);
    assert.match(email.html, /Cotización recibida/);
    assert.match(email.html, /Carolina Gómez/);
    assert.match(email.html, /wa\.me\/56997406693/);
    assert.doesNotMatch(email.html, /Providencia/);
    assert.doesNotMatch(email.html, /Las Condes/);
    assert.doesNotMatch(email.html, /Sofá/);
    assert.doesNotMatch(email.html, /15\.5/);
    assert.doesNotMatch(email.html, /m³/);
    assert.doesNotMatch(email.html, /IVA/);
    assert.doesNotMatch(email.html, /\$/);
  });
});

describe("notifyNewQuoteSubmitted", () => {
  it("defaults to transportesep3@gmail.com when ADMIN_NOTIFICATION_EMAIL is unset", async () => {
    const previousKey = process.env.RESEND_API_KEY;
    const previousAdmin = process.env.ADMIN_NOTIFICATION_EMAIL;
    const previousStaffAdmin = process.env.ADMIN_EMAIL;
    delete process.env.RESEND_API_KEY;
    delete process.env.ADMIN_NOTIFICATION_EMAIL;
    process.env.ADMIN_EMAIL = "admin@transportesep3.cl";
    try {
      const result = await notifyNewQuoteSubmitted({
        quoteId: "q-default",
        budgetId: "b-default",
        clientName: "Juan Pérez",
        clientEmail: "juan@example.com",
        clientPhone: "+56911223344",
        originAddress: "Providencia 123",
        destinationAddress: "Las Condes 456",
        totalM3: 5,
        estimatedAmount: 80000,
      });

      assert.equal(result.adminResult?.to, "transportesep3@gmail.com");
      assert.match(result.adminResult?.subject ?? "", /Nueva cotización web/);
    } finally {
      if (previousKey === undefined) delete process.env.RESEND_API_KEY;
      else process.env.RESEND_API_KEY = previousKey;
      if (previousAdmin === undefined) delete process.env.ADMIN_NOTIFICATION_EMAIL;
      else process.env.ADMIN_NOTIFICATION_EMAIL = previousAdmin;
      if (previousStaffAdmin === undefined) delete process.env.ADMIN_EMAIL;
      else process.env.ADMIN_EMAIL = previousStaffAdmin;
    }
  });

  it("sends the acknowledgment to the client and the notice to the admin", async () => {
    const previousKey = process.env.RESEND_API_KEY;
    const previousAdmin = process.env.ADMIN_NOTIFICATION_EMAIL;
    delete process.env.RESEND_API_KEY;
    process.env.ADMIN_NOTIFICATION_EMAIL = "ops@transportesep3.cl";
    try {
      const result = await notifyNewQuoteSubmitted({
        quoteId: "q-123",
        budgetId: "b-456",
        clientName: "Carolina Gómez",
        clientEmail: "carolina@example.com",
        clientPhone: "+56912345678",
        originAddress: "Providencia 123",
        destinationAddress: "Las Condes 456",
        totalM3: 15.5,
        estimatedAmount: 350000,
      });

      assert.equal(result.clientResult.to, "carolina@example.com");
      assert.equal(result.clientResult.subject, NEW_QUOTE_CLIENT_SUBJECT);
      assert.equal(result.clientResult.skipped, false);
      assert.equal(result.adminResult?.to, "ops@transportesep3.cl");
      assert.match(result.adminResult?.subject ?? "", /Nueva cotización web/);
    } finally {
      if (previousKey === undefined) delete process.env.RESEND_API_KEY;
      else process.env.RESEND_API_KEY = previousKey;
      if (previousAdmin === undefined) delete process.env.ADMIN_NOTIFICATION_EMAIL;
      else process.env.ADMIN_NOTIFICATION_EMAIL = previousAdmin;
    }
  });
});

describe("buildNewQuoteAdminEmail", () => {
  it("formats admin alert with all client details, link to panel and brand colors", () => {
    const email = buildNewQuoteAdminEmail(
      {
        quoteId: "q-123",
        budgetId: "b-456",
        clientName: "Carolina Gómez",
        clientEmail: "carolina@example.com",
        clientPhone: "+56912345678",
        originAddress: "Providencia 123",
        destinationAddress: "Las Condes 456",
        totalM3: 15.5,
        estimatedAmount: 350000,
        preferredDate: "2026-12-01",
        notes: "Edificio con conserjería",
        siteUrl: "https://www.transportesep3.cl",
      },
      "admin@transportesep3.cl",
    );

    assert.equal(email.to, "admin@transportesep3.cl");
    assert.match(email.subject, /Nueva cotización web: Carolina Gómez \(15\.5 m³\)/);
    assert.match(email.text, /Cliente: Carolina Gómez/);
    assert.match(email.text, /Teléfono: \+56912345678/);
    assert.match(email.text, /Correo: carolina@example\.com/);
    assert.match(email.text, /Notas cliente: Edificio con conserjería/);
    assert.match(email.text, /https:\/\/www\.transportesep3\.cl\/panel\/presupuestos\/b-456/);

    // HTML checks
    assert.match(email.html, /#001F54/);
    assert.match(email.html, /#FFCC00/);
    assert.match(email.html, /PANEL DE OPERACIONES/);
    assert.match(email.html, /Carolina Gómez/);
    assert.match(email.html, /https:\/\/www\.transportesep3\.cl\/panel\/presupuestos\/b-456/);
  });
});
