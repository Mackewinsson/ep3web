import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isReadyForEnCamino, jobIsLocked } from "./job-rules";

describe("jobIsLocked", () => {
  it("locks completed and cancelled only", () => {
    assert.equal(jobIsLocked("completed"), true);
    assert.equal(jobIsLocked("cancelled"), true);
    assert.equal(jobIsLocked("assigned"), false);
    assert.equal(jobIsLocked("in_progress"), false);
    assert.equal(jobIsLocked("pending_assignment"), false);
  });
});

describe("isReadyForEnCamino", () => {
  const ready = {
    truckId: "t1",
    crewDriverId: "c1",
    crewDriverRut: "12.345.678-9",
    salvoConductoCompletedAt: new Date(),
  };

  it("requires truck, crew, RUT and acceptance timestamp", () => {
    assert.equal(isReadyForEnCamino(ready), true);
    assert.equal(isReadyForEnCamino(null), false);
    assert.equal(isReadyForEnCamino({ ...ready, truckId: null }), false);
    assert.equal(isReadyForEnCamino({ ...ready, crewDriverId: null }), false);
    assert.equal(isReadyForEnCamino({ ...ready, crewDriverRut: null }), false);
    assert.equal(isReadyForEnCamino({ ...ready, crewDriverRut: "" }), false);
    assert.equal(
      isReadyForEnCamino({ ...ready, salvoConductoCompletedAt: null }),
      false,
    );
  });
});
