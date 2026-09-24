import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adminJobBadge, driverJobBadge, formatClientPackagePrice, formatClpPlusIva, trimDecimals } from "./format";

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

describe("driverJobBadge", () => {
  it("splits assigned into por aceptar vs por iniciar", () => {
    assert.deepEqual(driverJobBadge("assigned", false), {
      label: "Por aceptar",
      tone: "warning",
    });
    assert.deepEqual(driverJobBadge("assigned", true), {
      label: "Por iniciar",
      tone: "info",
    });
  });

  it("keeps other statuses unchanged", () => {
    assert.deepEqual(driverJobBadge("in_progress", true), {
      label: "En camino",
      tone: "accent",
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

describe("trimDecimals", () => {
  it("drops trailing zeros from DB numerics", () => {
    assert.equal(trimDecimals("3.00"), "3");
    assert.equal(trimDecimals("20.00"), "20");
    assert.equal(trimDecimals("3.50"), "3.5");
    assert.equal(trimDecimals("0.080"), "0.08");
    assert.equal(trimDecimals("0.00"), "0");
    assert.equal(trimDecimals(25000), "25000");
  });

  it("passes through empty and non-numeric values", () => {
    assert.equal(trimDecimals(null), "");
    assert.equal(trimDecimals(""), "");
    assert.equal(trimDecimals("abc"), "abc");
  });
});
