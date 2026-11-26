import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFollowUpClientEmail } from "./follow-up";

describe("buildFollowUpClientEmail", () => {
  it("generates branded follow-up email for leads", () => {
    const email = buildFollowUpClientEmail({
      clientName: "Rodrigo Morales",
      clientEmail: "rodrigo@example.com",
      routeSummary: "Ñuñoa → Las Condes",
      estimatedAmount: "$120.000 + IVA",
    });

    assert.equal(email.to, "rodrigo@example.com");
    assert.match(email.subject, /Seguimiento de tu cotización/);
    assert.match(email.text, /Hola Rodrigo Morales,/);
    assert.match(email.text, /Ñuñoa → Las Condes/);
    assert.match(email.text, /\$120\.000 \+ IVA/);

    // HTML checks
    assert.match(email.html, /#001F54/);
    assert.match(email.html, /#FFCC00/);
    assert.match(email.html, /TRANSPORTES/);
    assert.match(email.html, /Rodrigo Morales/);
    assert.match(email.html, /wa\.me\/56997406693/);
  });
});

