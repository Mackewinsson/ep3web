import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildClientQuoteEmail } from "./client-quote";

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
});
