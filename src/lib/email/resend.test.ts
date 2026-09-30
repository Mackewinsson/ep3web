import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDriverAssignmentEmail } from "./resend";

describe("buildDriverAssignmentEmail", () => {
  it("describes the job and drops client price lines", () => {
    const email = buildDriverAssignmentEmail({
      driverName: "Luis",
      driverEmail: "luis@example.com",
      clientName: "Ana",
      originAddress: "Las Condes",
      destinationAddress: "Ñuñoa",
      scheduledDate: "2026-10-02",
      scheduledTime: "09:00",
      notes: "Llevar mantas\nEstimación auto: 12 m³ · $450.000 CLP",
    });
    assert.equal(email.to, "luis@example.com");
    assert.match(email.subject, /Ana/);
    assert.match(email.text, /Las Condes/);
    assert.match(email.text, /Ñuñoa/);
    assert.match(email.text, /2026-10-02 · 09:00/);
    assert.match(email.text, /Llevar mantas/);
    assert.doesNotMatch(email.text, /CLP|\$450/);
    assert.doesNotMatch(email.text, /Camión:/);
  });

  it("includes the truck when one is already chosen", () => {
    const email = buildDriverAssignmentEmail({
      driverName: "Luis",
      driverEmail: " luis@example.com ",
      truckPlate: "ABCD12",
      truckLabel: "3/4",
      clientName: "Ana",
      originAddress: "A",
      destinationAddress: "B",
    });
    assert.equal(email.to, "luis@example.com");
    assert.match(email.text, /Camión: ABCD12 \(3\/4\)/);
  });
});
