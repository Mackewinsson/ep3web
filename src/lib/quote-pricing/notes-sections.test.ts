import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clientMessageFromNotes,
  parseNotesSections,
  serviceDetailsFromNotes,
} from "./notes-sections";

const WIZARD_NOTES = [
  "Origen: Casa — Calle Uno 123 · estacionamiento: Sí, a menos de 40 metros",
  "Destino: Departamento — Calle Dos 456 · piso 4 · sin ascensor · estacionamiento: Sí, a menos de 40 metros",
  "Ayudantes: Chofer (el chofer te ayuda)",
  "Delicados: Sí — pecera",
  "Inventario: 10× Bolsas plásticas grandes, 10× Caja 60×40×40, 10× Maletas, 1× pecera",
  "Cajas: 20",
  "Hora preferida: 14:00",
  "Notas cliente: embalaje",
  "Cargos: Ayuda chofer y ayudante",
  "Estimación auto: 2.56 m³ · $128.400 CLP",
].join("\n");

describe("parseNotesSections", () => {
  it("keeps the client answers that live nowhere else", () => {
    const { service } = parseNotesSections(WIZARD_NOTES);
    assert.deepEqual(
      service.map((s) => s.label),
      ["Origen", "Destino", "Ayudantes", "Delicados", "Hora preferida", "Notas cliente"],
    );
    assert.match(service[1].value, /piso 4 · sin ascensor/);
    assert.equal(service[2].value, "Chofer (el chofer te ayuda)");
  });

  it("drops the lines the item table already shows", () => {
    const { service, freeText } = parseNotesSections(WIZARD_NOTES);
    const all = [...service.map((s) => s.value), freeText].join("\n");
    assert.doesNotMatch(all, /Bolsas plásticas/);
    assert.doesNotMatch(all, /Estimación auto/);
    assert.doesNotMatch(all, /Cajas:/);
    assert.doesNotMatch(all, /Cargos:/);
  });

  it("returns no free text for a pure wizard dump", () => {
    assert.equal(clientMessageFromNotes(WIZARD_NOTES), "");
  });

  it("keeps admin text written after the generated lines", () => {
    const notes = `${WIZARD_NOTES}\nLlamar antes de llegar, el portón es angosto.`;
    assert.equal(
      clientMessageFromNotes(notes),
      "Llamar antes de llegar, el portón es angosto.",
    );
  });

  it("keeps admin text written before the wizard block", () => {
    const notes = `Cliente pidió factura.\n${WIZARD_NOTES}`;
    assert.equal(clientMessageFromNotes(notes), "Cliente pidió factura.");
  });

  it("treats wrapped lines under Inventario as part of the inventory", () => {
    const notes = [
      "Inventario: 10× Bolsas plásticas grandes,",
      "3× Sofá, 1× Mesa",
      "Cajas: 4",
      "Mensaje real",
    ].join("\n");
    assert.equal(clientMessageFromNotes(notes), "Mensaje real");
  });

  it("does not treat text after a blank line as an inventory continuation", () => {
    const notes = ["Inventario: 2× Sofá", "", "Gracias por preferirnos"].join(
      "\n",
    );
    assert.equal(clientMessageFromNotes(notes), "Gracias por preferirnos");
  });

  it("handles free text, empty and missing notes", () => {
    assert.equal(clientMessageFromNotes("Solo un mensaje"), "Solo un mensaje");
    assert.equal(clientMessageFromNotes(""), "");
    assert.equal(clientMessageFromNotes(null), "");
    assert.deepEqual(serviceDetailsFromNotes(null), []);
  });

  it("accepts the unaccented Estimacion auto spelling", () => {
    assert.equal(clientMessageFromNotes("Estimacion auto: 3 m³"), "");
  });
});
