import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  accessExtrasWithoutAddress,
  buildOperatorServiceNotes,
} from "./operator-notes";

const wizardNotes = [
  "Origen: Casa — Morande, Las Palmas Norte, Llay-Llay, Chile · estacionamiento: Sí, a menos de 40 metros",
  "Destino: Casa — Riete 43 · estacionamiento: Sí, a menos de 40 metros",
  "Ayudantes: Chofer y 1 ayudante (ambos ayudan)",
  "Delicados: No",
  "Inventario: 1x Árbol de navidad, 1x Cooler, 1x Futón o Sofá Cama de 1 Plaza",
  "Hora preferida: 08:06",
  "Notas cliente: llegar temprano",
  "Estimación auto: 12.3 m³ · $200.000 CLP",
].join("\n");

describe("buildOperatorServiceNotes", () => {
  it("does not repeat the same volume blob from job notes", () => {
    const notes = buildOperatorServiceNotes(wizardNotes, wizardNotes, {
      scheduledTime: "08:06",
      originAddress: "Morande, Las Palmas Norte, Llay-Llay, Chile",
      destinationAddress: "Riete 43",
    });

    assert.equal(notes.helpers, "Chofer y 1 ayudante (ambos ayudan)");
    assert.equal(notes.fragile, "No");
    assert.deepEqual(notes.inventoryItems, [
      "1x Árbol de navidad",
      "1x Cooler",
      "1x Futón o Sofá Cama de 1 Plaza",
    ]);
    assert.equal(notes.preferredTime, null);
    assert.equal(notes.clientNotes, "llegar temprano");
    assert.equal(notes.extraLines, null);
    assert.equal(
      notes.originAccess,
      "Casa · estacionamiento: Sí, a menos de 40 metros",
    );
    assert.equal(
      notes.destinationAccess,
      "Casa · estacionamiento: Sí, a menos de 40 metros",
    );
  });

  it("keeps hora preferida only when the header has no time", () => {
    const notes = buildOperatorServiceNotes(wizardNotes, null);
    assert.equal(notes.preferredTime, "08:06");
  });

  it("merges extra job-only lines without duplicating inventory", () => {
    const notes = buildOperatorServiceNotes(wizardNotes, "Llamar al llegar\n");
    assert.equal(notes.extraLines, "Llamar al llegar");
    assert.equal(notes.inventoryItems.length, 3);
  });

  it("strips client price lines", () => {
    const notes = buildOperatorServiceNotes(
      "Inventario: 1x Caja\nEstimación auto: 2 m³ · $50.000 CLP",
      null,
    );
    assert.deepEqual(notes.inventoryItems, ["1x Caja"]);
    assert.equal(notes.extraLines, null);
  });
});

describe("accessExtrasWithoutAddress", () => {
  it("keeps property type and parking", () => {
    assert.equal(
      accessExtrasWithoutAddress(
        "Casa — Providencia 100 · estacionamiento: No, a más de 40 metros",
        "Providencia 100",
      ),
      "Casa · estacionamiento: No, a más de 40 metros",
    );
  });
});
