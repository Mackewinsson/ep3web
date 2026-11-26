import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildClientJobAcceptedEmail,
  clientJobAcceptedStatusCopy,
} from "./client-job-accepted";

describe("buildClientJobAcceptedEmail", () => {
  it("includes driver name, RUT, truck plate, and route in text and HTML", () => {
    const email = buildClientJobAcceptedEmail({
      clientName: "Carolina",
      clientEmail: "carolina@example.com",
      originAddress: "Providencia 123",
      destinationAddress: "Las Condes 456",
      crewDriverName: "Pedro Soto",
      crewDriverRut: "12.345.678-9",
      truckPlate: "KJHG88",
      truckLabel: "Mercedes Sprinter",
      scheduledDate: "2026-12-05",
      scheduledTime: "10:00",
    });

    assert.equal(email.to, "carolina@example.com");
    assert.match(email.subject, /confirmada/i);
    assert.match(email.text, /Pedro Soto/);
    assert.match(email.text, /12\.345\.678-9/);
    assert.match(email.text, /KJHG88/);
    assert.match(email.text, /Mercedes Sprinter/);
    assert.match(email.text, /Providencia 123/);
    assert.match(email.text, /Las Condes 456/);
    assert.match(email.text, /10:00/);
    assert.doesNotMatch(email.text, /\$|CLP|IVA/);

    assert.match(email.html, /<!DOCTYPE html>/i);
    assert.match(email.html, /Pedro Soto/);
    assert.match(email.html, /12\.345\.678-9/);
    assert.match(email.html, /KJHG88/);
    assert.match(email.html, /Mercedes Sprinter/);
    assert.match(email.html, /Providencia 123/);
    assert.match(email.html, /Las Condes 456/);
    assert.match(email.html, /10:00/);
    assert.match(email.html, /wa\.me\/56997406693/);
    assert.match(email.html, /\+56 9 9740 6693/);
    assert.doesNotMatch(email.html, /\$|CLP|IVA/);
  });
});

describe("clientJobAcceptedStatusCopy", () => {
  it("states whether the confirmation was sent, failed, or skipped", () => {
    assert.match(
      clientJobAcceptedStatusCopy("carolina@example.com"),
      /carolina@example.com/,
    );
    assert.match(
      clientJobAcceptedStatusCopy("carolina@example.com", { failed: true }),
      /No se pudo enviar/,
    );
    assert.match(clientJobAcceptedStatusCopy(null), /no tiene correo/);
    assert.match(clientJobAcceptedStatusCopy("  "), /no tiene correo/);
  });
});
