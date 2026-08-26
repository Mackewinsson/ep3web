import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractAutoEstimateM3,
  formatM3,
  operatorPayoutFromClientTotal,
  stripClientPriceLines,
  syncAutoEstimateInNotes,
} from "./calculate";

describe("operatorPayoutFromClientTotal", () => {
  it("applies default 20% margin", () => {
    assert.equal(operatorPayoutFromClientTotal(100_000), 80_000);
  });

  it("uses custom margin", () => {
    assert.equal(operatorPayoutFromClientTotal(100_000, 10), 90_000);
  });

  it("returns 0 for invalid totals", () => {
    assert.equal(operatorPayoutFromClientTotal(0), 0);
    assert.equal(operatorPayoutFromClientTotal(NaN), 0);
  });
});

describe("stripClientPriceLines", () => {
  it("removes estimación auto and CLP lines", () => {
    const notes = [
      "Inventario:",
      "1x Sofa",
      "Estimación auto: 9.89 m³ · $200.000 CLP",
      "Notas cliente: llegar puntual",
      "Extra $50.000 CLP",
    ].join("\n");
    assert.equal(
      stripClientPriceLines(notes),
      ["Inventario:", "1x Sofa", "Notas cliente: llegar puntual"].join("\n"),
    );
  });

  it("returns null for empty after strip", () => {
    assert.equal(
      stripClientPriceLines("Estimación auto: 1 m³ · $1 CLP"),
      null,
    );
  });
});

describe("syncAutoEstimateInNotes", () => {
  it("updates m³ and scales amount in both $ CLP formats", () => {
    const withDollar = syncAutoEstimateInNotes(
      "Estimación auto: 9.89 m³ · $200.000 CLP",
      12.29,
    );
    assert.match(withDollar, /Estimación auto: 12\.29 m³ · \$248\.534 CLP/);

    const plain = syncAutoEstimateInNotes(
      "Estimación auto: 9.89 m³ · 200.000",
      12.29,
    );
    assert.match(plain, /Estimación auto: 12\.29 m³ · \$248\.534 CLP/);
  });

  it("does not corrupt dollar amounts via String.replace $n", () => {
    const out = syncAutoEstimateInNotes(
      "Estimación auto: 10 m³ · $100.000 CLP",
      20,
    );
    assert.equal(out, "Estimación auto: 20 m³ · $200.000 CLP");
  });

  it("appends a line using pricePerM3 when missing", () => {
    const out = syncAutoEstimateInNotes("Inventario:\n1x Caja", 10, {
      pricePerM3: 25_000,
    });
    assert.match(out, /Inventario:\n1x Caja\nEstimación auto: 10 m³ · \$250\.000 CLP/);
  });

  it("leaves notes unchanged for invalid m³", () => {
    const notes = "Estimación auto: 9.89 m³ · $200.000 CLP";
    assert.equal(syncAutoEstimateInNotes(notes, 0), notes);
    assert.equal(syncAutoEstimateInNotes(notes, NaN), notes);
  });
});

describe("extractAutoEstimateM3", () => {
  it("parses m³ from the auto line", () => {
    assert.equal(
      extractAutoEstimateM3("Estimación auto: 9.89 m³ · $200.000 CLP"),
      9.89,
    );
  });

  it("returns null when missing", () => {
    assert.equal(extractAutoEstimateM3("solo inventario"), null);
  });
});

describe("formatM3", () => {
  it("trims trailing zeros", () => {
    assert.equal(formatM3(12.29), "12.29");
    assert.equal(formatM3(12), "12");
    assert.equal(formatM3(12.1), "12.1");
  });
});
