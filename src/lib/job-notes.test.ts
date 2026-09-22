import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { notesContentEqual, operationalJobNotes } from "./job-notes";

describe("operationalJobNotes", () => {
  it("returns null when empty so admin can write", () => {
    assert.equal(operationalJobNotes(null, "Inventario:\n1x Sofa"), null);
    assert.equal(operationalJobNotes("  ", "Inventario:\n1x Sofa"), null);
  });

  it("hides job notes that duplicate volume details", () => {
    const volume = "Inventario:\n1x Sofa\nEstimación auto: 12 m³ — $180.000";
    assert.equal(operationalJobNotes(volume, volume), null);
    assert.equal(
      operationalJobNotes(`  ${volume}  `, volume),
      null,
    );
  });

  it("hides volume copies even when one side still has price lines", () => {
    const withPrice =
      "Inventario:\n1x Sofa\nEstimación auto: 12 m³ — $180.000";
    const withoutPrice = "Inventario:\n1x Sofa";
    assert.equal(operationalJobNotes(withPrice, withoutPrice), null);
  });

  it("keeps operational notes that are not the volume snapshot", () => {
    assert.equal(
      operationalJobNotes("Llamar al portero", "Inventario:\n1x Sofa"),
      "Llamar al portero",
    );
  });
});

describe("notesContentEqual", () => {
  it("ignores extra whitespace", () => {
    assert.equal(notesContentEqual("a\n b", "a b"), true);
    assert.equal(notesContentEqual("a", "b"), false);
  });
});
