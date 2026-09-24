import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  adjustM3Line,
  budgetItemVolumeM3,
  buildQuoteEstimate,
  buildVolumeBreakdown,
  createUnitVolumeResolver,
  pickAutoM3Line,
  extractAutoEstimateAmount,
  extractAutoEstimateM3,
  formatM3,
  inventoryItemsMissingFromBudget,
  operatorPayoutFromClientTotal,
  parseCajasCount,
  operatorPayoutFromQuoteSources,
  parseInventarioEntries,
  resolveQuotedClientTotal,
  stripClientPriceLines,
  syncAutoEstimateInNotes,
  syncBudgetItemsInNotes,
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

describe("syncAutoEstimateInNotes amount override", () => {
  it("uses the budget total instead of scaling", () => {
    const out = syncAutoEstimateInNotes(
      "Estimación auto: 10 m³ · $100.000 CLP",
      10,
      { amount: 458_500 },
    );
    assert.equal(out, "Estimación auto: 10 m³ · $458.500 CLP");
  });
});

describe("syncBudgetItemsInNotes", () => {
  const seed = [
    "Origen: casa — Santiago",
    "Ayudantes: Chofer + 1",
    "Inventario: 2× Sofá, 1× Silla",
    "Cajas: 6",
    "Estimación auto: 10 m³ · $200.000 CLP",
  ].join("\n");

  it("adds a manual unit item to Inventario and the new total to Estimación auto", () => {
    const out = syncBudgetItemsInNotes(
      seed,
      [
        { description: "Sofá", pricingUnit: "unit", quantity: 2 },
        { description: "Silla", pricingUnit: "unit", quantity: 1 },
        { description: "Piano", pricingUnit: "unit", quantity: 1 },
        { description: "Caja de mudanza", pricingUnit: "unit", quantity: 6 },
        {
          description: "Mudanza estimada (10 m³)",
          pricingUnit: "m3",
          quantity: 10,
        },
      ],
      { totalAmount: 350_000, estimatedM3: 10 },
    );
    assert.match(out, /Inventario: 2× Sofá, 1× Silla, 1× Piano/);
    assert.match(out, /Cajas: 6/);
    assert.match(out, /Estimación auto: 10 m³ · \$350\.000 CLP/);
    assert.match(out, /Origen: casa — Santiago/);
    assert.doesNotMatch(out, /^Cargos:/m);
  });

  it("lists a manual fixed charge on Cargos without dropping other lines", () => {
    const out = syncBudgetItemsInNotes(
      seed,
      [
        { description: "Sofá", pricingUnit: "unit", quantity: 2 },
        { description: "Recargo piano", pricingUnit: "fixed", quantity: 1 },
        { description: "Caja de mudanza", pricingUnit: "unit", quantity: 6 },
      ],
      { totalAmount: 250_000, estimatedM3: 10 },
    );
    assert.match(out, /^Cargos: Recargo piano$/m);
    assert.match(out, /Ayudantes: Chofer \+ 1/);
  });

  it("drops a removed unit item from Inventario", () => {
    const out = syncBudgetItemsInNotes(
      seed,
      [{ description: "Sofá", pricingUnit: "unit", quantity: 2 }],
      { mergeInventory: false },
    );
    assert.match(out, /Inventario: 2× Sofá$/m);
    assert.doesNotMatch(out, /Silla/);
  });

  it("keeps the client's Inventario when only a manual line exists on the budget", () => {
    const out = syncBudgetItemsInNotes(seed, [
      { description: "Piano", pricingUnit: "unit", quantity: 1 },
    ]);
    assert.match(out, /Inventario: 1× Piano, 2× Sofá, 1× Silla/);
    assert.match(out, /Origen: casa — Santiago/);
  });

  it("keeps catalog boxes in Inventario and only counts Caja de mudanza as Cajas", () => {
    const out = syncBudgetItemsInNotes(
      "Inventario: 2× Caja 60×40×40",
      [
        { description: "Caja 60×40×40", pricingUnit: "unit", quantity: 2 },
        { description: "Caja de mudanza", pricingUnit: "unit", quantity: 6 },
      ],
    );
    assert.match(out, /Inventario: 2× Caja 60×40×40/);
    assert.match(out, /Cajas: 6/);
  });
});

describe("parseInventarioEntries", () => {
  it("parses a comma-separated Inventario line", () => {
    const entries = parseInventarioEntries(
      "Inventario: 2× Sofá, 1× Silla\nCajas: 6",
    );
    assert.deepEqual(
      entries.map((e) => `${e.quantity} ${e.description}`),
      ["2 Sofá", "1 Silla"],
    );
  });
});

describe("inventoryItemsMissingFromBudget", () => {
  it("returns client items that are not yet budget rows", () => {
    const missing = inventoryItemsMissingFromBudget(
      "Inventario: 2× Sofá, 1× Silla",
      [{ description: "Piano", pricingUnit: "unit", quantity: 1 }],
    );
    assert.deepEqual(
      missing.map((e) => e.description).sort(),
      ["Silla", "Sofá"],
    );
  });
});

describe("buildVolumeBreakdown", () => {
  const catalog = [
    { name: "Sofá 3 cuerpos", volumeM3: 1.5 },
    { name: "Cama 2 plazas", volumeM3: 2 },
  ];

  it("explains m³ from catalog items and boxes", () => {
    const result = buildVolumeBreakdown({
      catalog,
      boxVolumeM3: 0.08,
      items: [
        { description: "Sofá 3 cuerpos", pricingUnit: "unit", quantity: 1 },
        { description: "Caja de mudanza", pricingUnit: "unit", quantity: 10 },
        { description: "Mudanza estimada (2.3 m³)", pricingUnit: "m3", quantity: 2.3 },
        { description: "Ayuda chofer", pricingUnit: "fixed", quantity: 1 },
      ],
    });
    assert.equal(result.lines.length, 2);
    assert.equal(result.lines[0].name, "Sofá 3 cuerpos");
    assert.equal(result.lines[0].lineVolumeM3, 1.5);
    assert.equal(result.lines[1].isPackingBox, true);
    assert.ok(Math.abs((result.lines[1].lineVolumeM3 ?? 0) - 0.8) < 1e-9);
    assert.equal(result.catalogM3, 2.3);
    assert.equal(result.chargedM3, 2.3);
    assert.equal(result.unexplainedM3, 0);
    assert.equal(result.totalItems, 11);
  });

  it("flags manual items without catalog volume and the unexplained gap", () => {
    const result = buildVolumeBreakdown({
      catalog,
      boxVolumeM3: 0.08,
      items: [
        { description: "cama 2 plazas", pricingUnit: "unit", quantity: 1 },
        { description: "Piano", pricingUnit: "unit", quantity: 1 },
        { description: "Mudanza estimada", pricingUnit: "m3", quantity: 5 },
      ],
    });
    const piano = result.lines.find((l) => l.name === "Piano");
    assert.equal(piano?.unitVolumeM3, null);
    assert.equal(result.catalogM3, 2);
    assert.equal(result.unexplainedM3, 3);
  });

  it("falls back to the quote m³ when there is no m³ line", () => {
    const result = buildVolumeBreakdown({
      catalog,
      boxVolumeM3: 0.08,
      items: [],
      fallbackChargedM3: 4,
    });
    assert.equal(result.chargedM3, 4);
    assert.equal(result.unexplainedM3, 4);
  });
});

describe("createUnitVolumeResolver", () => {
  const resolve = createUnitVolumeResolver(
    [{ name: "Sofá 3 cuerpos", volumeM3: 1.5 }],
    0.08,
  );

  it("prefers stored volume, then box volume, then catalog", () => {
    assert.equal(resolve({ description: "Sofá 3 cuerpos", unitVolumeM3: 2 }), 2);
    assert.equal(resolve({ description: "Caja de mudanza", unitVolumeM3: null }), 0.08);
    assert.equal(resolve({ description: "sofá 3 cuerpos", unitVolumeM3: null }), 1.5);
    assert.equal(resolve({ description: "Piano", unitVolumeM3: null }), null);
  });

  it("only unit lines add volume", () => {
    assert.equal(
      budgetItemVolumeM3(
        { description: "Caja de mudanza", pricingUnit: "unit", quantity: 10 },
        resolve,
      ).toFixed(2),
      "0.80",
    );
    assert.equal(
      budgetItemVolumeM3(
        { description: "Sofá 3 cuerpos", pricingUnit: "fixed", quantity: 1 },
        resolve,
      ),
      0,
    );
  });
});

describe("adjustM3Line", () => {
  it("adds the delta and renames the auto line", () => {
    assert.deepEqual(
      adjustM3Line({
        current: { description: "Mudanza estimada (5 m³)", quantity: 5 },
        deltaM3: 1.2,
      }),
      { action: "upsert", description: "Mudanza estimada (6.2 m³)", quantity: 6.2 },
    );
  });

  it("keeps a custom m³ line description", () => {
    assert.deepEqual(
      adjustM3Line({
        current: { description: "Flete por m³", quantity: 5 },
        deltaM3: -1,
      }),
      { action: "upsert", description: "Flete por m³", quantity: 4 },
    );
  });

  it("creates the line when missing and deletes it at zero", () => {
    assert.deepEqual(adjustM3Line({ current: null, deltaM3: 2 }), {
      action: "upsert",
      description: "Mudanza estimada (2 m³)",
      quantity: 2,
    });
    assert.deepEqual(
      adjustM3Line({
        current: { description: "Mudanza estimada (1 m³)", quantity: 1 },
        deltaM3: -1,
      }),
      { action: "delete" },
    );
    assert.deepEqual(adjustM3Line({ current: null, deltaM3: -1 }), { action: "none" });
    assert.deepEqual(
      adjustM3Line({ current: { description: "x", quantity: 3 }, deltaM3: 0 }),
      { action: "none" },
    );
  });

  it("picks the auto line before other m³ lines", () => {
    const line = pickAutoM3Line([
      { description: "Flete", pricingUnit: "m3" },
      { description: "Mudanza estimada (3 m³)", pricingUnit: "m3" },
    ]);
    assert.equal(line?.description, "Mudanza estimada (3 m³)");
  });
});

describe("buildQuoteEstimate volumes", () => {
  it("stores per-unit m³ on inventory and box lines", () => {
    const estimate = buildQuoteEstimate({
      quantities: { sofa: 1 },
      items: [{ id: "sofa", name: "Sofá", volumeM3: 1.5 }],
      packingBoxes: 10,
    });
    const sofa = estimate.budgetLines.find((l) => l.description === "Sofá");
    const boxes = estimate.budgetLines.find((l) => l.description === "Caja de mudanza");
    assert.equal(sofa?.unitVolumeM3, 1.5);
    assert.equal(boxes?.unitVolumeM3, estimate.config.boxVolumeM3);
  });
});

describe("parseCajasCount", () => {
  it("reads the Cajas summary line", () => {
    assert.equal(parseCajasCount("Inventario: 1× Sofá\nCajas: 12\nCargos: x"), 12);
  });

  it("returns 0 when absent or not a positive number", () => {
    assert.equal(parseCajasCount("Inventario: 1× Sofá"), 0);
    assert.equal(parseCajasCount("Cajas: 0"), 0);
    assert.equal(parseCajasCount(null), 0);
  });
});
