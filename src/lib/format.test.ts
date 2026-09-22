import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adminJobBadge } from "./format";

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
