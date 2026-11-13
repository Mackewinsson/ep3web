import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildNewQuoteAdminEmail,
  buildNewQuoteClientEmail,
  NEW_QUOTE_CLIENT_SUBJECT,
} from "./new-quote";

describe("buildNewQuoteClientEmail", () => {
  it("formats client confirmation email with summary and + IVA", () => {
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
    });

    assert.equal(email.to, "carolina@example.com");
    assert.equal(email.subject, NEW_QUOTE_CLIENT_SUBJECT);
    assert.match(email.text, /Hola Carolina Gómez,/);
    assert.match(email.text, /Providencia 123/);
    assert.match(email.text, /Las Condes 456/);
    assert.match(email.text, /15\.5 m³/);
    assert.match(email.text, /\+ IVA/);
    assert.match(email.text, /2026-12-01 a las 10:00/);
  });
});

describe("buildNewQuoteAdminEmail", () => {
  it("formats admin alert with all client details and link to panel", () => {
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
  });
});
