import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAdminNewQuoteEmail } from "./admin-new-quote";

describe("buildAdminNewQuoteEmail", () => {
  it("tells the admin a quote arrived and that the client is not emailed yet", () => {
    const previous = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.transportesep3.cl";
    try {
      const email = buildAdminNewQuoteEmail({
        clientName: "Ana",
        clientEmail: "ana@example.com",
        clientPhone: "+56911111111",
        originAddress: "Providencia",
        destinationAddress: "Ñuñoa",
        summary: "12 m³ · $450.000 + IVA",
        href: "/panel/presupuestos/abc",
      });
      assert.match(email.subject, /Nueva cotización — Ana/);
      assert.match(email.text, /ana@example.com/);
      assert.match(email.text, /Providencia/);
      assert.match(email.text, /\$450\.000 \+ IVA/);
      assert.match(email.text, /todavía no recibe/);
      assert.match(
        email.text,
        /https:\/\/www\.transportesep3\.cl\/panel\/presupuestos\/abc/,
      );
    } finally {
      if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = previous;
    }
  });
});