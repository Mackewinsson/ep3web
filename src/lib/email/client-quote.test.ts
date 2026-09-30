import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildClientQuoteEmail,
  shouldEmailQuoteToClient,
} from "./client-quote";

describe("buildClientQuoteEmail", () => {
  it("shows the quote total with + IVA", () => {
    const email = buildClientQuoteEmail({
      clientName: "Ana",
      clientEmail: "ana@example.com",
      title: "Mudanza Las Condes",
      totalAmount: 450000,
    });
    assert.equal(email.to, "ana@example.com");
    assert.match(email.subject, /Mudanza Las Condes/);
    assert.match(email.text, /Total: .+\+ IVA/);
    assert.match(email.text, /no incluye IVA/i);
  });

  it("keeps the client message and drops the wizard inventory dump", () => {
    const email = buildClientQuoteEmail({
      clientName: "Ana",
      clientEmail: "ana@example.com",
      title: "Mudanza",
      totalAmount: 1000,
      notes: "Inventario: sofá x1\n\nCliente pidió factura.",
    });
    assert.match(email.text, /Cliente pidió factura/);
    assert.doesNotMatch(email.text, /Inventario:/);
  });
});

describe("shouldEmailQuoteToClient", () => {
  it("emails on send, and on approve only when the quote was never sent", () => {
    assert.equal(shouldEmailQuoteToClient("draft", "sent"), true);
    assert.equal(shouldEmailQuoteToClient("draft", "approved"), true);
    assert.equal(shouldEmailQuoteToClient("sent", "approved"), false);
    assert.equal(shouldEmailQuoteToClient("draft", "rejected"), false);
  });
});
