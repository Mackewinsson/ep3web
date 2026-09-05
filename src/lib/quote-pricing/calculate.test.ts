import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractAutoEstimateAmount,
  extractAutoEstimateM3,
  formatM3,
  operatorPayoutFromClientTotal,
  operatorPayoutFromQuoteSources,
  resolveQuotedClientTotal,
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

describe("resolveQuotedClientTotal", () => {
  const notes = "Estimación auto: 9.89 m³ · $200.000 CLP";

  it("prefers a positive budget total", () => {
    assert.equal(
      resolveQuotedClientTotal({ budgetTotal: "458500.00", notes }),
      458500,
    );
  });

  it("treats 0 budget as missing and uses estimación auto", () => {
    assert.equal(
      resolveQuotedClientTotal({ budgetTotal: "0.00", notes }),
      200_000,
    );
  });

  it("falls back to m³ × pricePerM3", () => {
    assert.equal(
      resolveQuotedClientTotal({
        budgetTotal: 0,
        estimatedM3: "10",
        pricePerM3: 25_000,
      }),
      250_000,
    );
  });

  it("returns null when nothing can be resolved", () => {
    assert.equal(resolveQuotedClientTotal({ budgetTotal: "0" }), null);
  });
});

describe("operatorPayoutFromQuoteSources", () => {
  it("applies 20% app commission to the quoted price", () => {
    assert.equal(operatorPayoutFromQuoteSources({ budgetTotal: 100_000 }), 80_000);
  });

  it("does not show $0 when the quote lives in notes", () => {
    assert.equal(
      operatorPayoutFromQuoteSources({
        budgetTotal: "0.00",
        notes: "Estimación auto: 8 m³ · $163.200 CLP",
      }),
      130_560,
    );
  });

  it("returns null when there is no quoted price", () => {
    assert.equal(operatorPayoutFromQuoteSources({ budgetTotal: "0.00" }), null);
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

describe("extractAutoEstimateAmount", () => {
  it("parses CLP from the auto line", () => {
    assert.equal(
      extractAutoEstimateAmount("Estimación auto: 9.89 m³ · $200.000 CLP"),
      200_000,
    );
  });

  it("returns null when the line has no amount", () => {
    assert.equal(extractAutoEstimateAmount("Estimación auto: 9.89 m³"), null);
  });
});

describe("formatM3", () => {
  it("trims trailing zeros", () => {
    assert.equal(formatM3(12.29), "12.29");
    assert.equal(formatM3(12), "12");
    assert.equal(formatM3(12.1), "12.1");
  });
});
