import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildClientEnCaminoEmail,
  clientEnCaminoStatusCopy,
} from "./client-en-camino";

describe("buildClientEnCaminoEmail", () => {
  it("tells the client the move is underway and omits any price", () => {
    const email = buildClientEnCaminoEmail({
      clientName: "Ana",
      clientEmail: "ana@example.com",
      originAddress: "Las Condes",
      destinationAddress: "Ñuñoa",
      crewDriverName: "Luis",
      truckPlate: "ABCD12",
    });
    assert.equal(email.to, "ana@example.com");
    assert.match(email.subject, /en camino/i);
    assert.match(email.text, /Las Condes/);
    assert.match(email.text, /Luis/);
    assert.match(email.text, /ABCD12/);
    assert.doesNotMatch(email.text, /\$|CLP|IVA/);
  });
});

describe("clientEnCaminoStatusCopy", () => {
  it("states whether the client had an address", () => {
    assert.match(clientEnCaminoStatusCopy("ana@example.com"), /ana@example.com/);
    assert.match(clientEnCaminoStatusCopy(null), /no tiene correo/);
    assert.match(clientEnCaminoStatusCopy("  "), /no tiene correo/);
  });
});