import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adminJobBadge, formatClientPackagePrice, formatClpPlusIva } from "./format";

describe("adminJobBadge", () => {
  it("splits assigned into waiting vs accepted", () => {
    assert.deepEqual(adminJobBadge("assigned", false), {
      label: "Por aceptar",
      tone: "warning",
    });
    assert.deepEqual(adminJobBadge("assigned", true), {
      label: "Aceptado",
      tone: "success",
    });
  });

  it("keeps other statuses unchanged even if accepted is true", () => {
    assert.deepEqual(adminJobBadge("pending_assignment", false), {
      label: "Sin conductor",
      tone: "warning",
    });
    assert.deepEqual(adminJobBadge("in_progress", true), {
      label: "En camino",
      tone: "accent",
    });
    assert.deepEqual(adminJobBadge("completed", true), {
      label: "Finalizado",
      tone: "success",
    });
    assert.deepEqual(adminJobBadge("cancelled", false), {
      label: "Cancelado",
      tone: "danger",
    });
  });
});

describe("formatClpPlusIva", () => {
  it("puts + IVA next to a valid quote total", () => {
    const out = formatClpPlusIva(150000);
    assert.match(out, /150/);
    assert.match(out, /\+ IVA$/);
  });

  it("does not suffix invalid amounts", () => {
    assert.equal(formatClpPlusIva("nope"), "—");
  });
});

describe("formatClientPackagePrice", () => {
  it("puts + IVA after the unit for m³ prices", () => {
    const out = formatClientPackagePrice(25000, "m3");
    assert.match(out, /m³ \+ IVA$/);
  });
});
