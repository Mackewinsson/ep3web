import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  findReusableClient,
  missingContactFields,
  normalizePersonName,
} from "./client-match";

const ana = { id: "1", name: "Ana Pérez", phone: "+56911111111", email: "ana@test.cl" };

describe("normalizePersonName", () => {
  it("ignores case, accents and extra spaces", () => {
    assert.equal(normalizePersonName("  ANA   perez "), normalizePersonName("Ana Pérez"));
  });
});

describe("findReusableClient", () => {
  it("reuses a client with the same name and phone", () => {
    assert.equal(
      findReusableClient([ana], { name: "ana perez", phone: "+56911111111", email: null })?.id,
      "1",
    );
  });

  it("reuses a client with the same name and email (case-insensitive)", () => {
    assert.equal(
      findReusableClient([ana], { name: "Ana Pérez", phone: "+56900000000", email: "ANA@test.cl" })?.id,
      "1",
    );
  });

  it("does not reuse (or rename) a client when the name differs", () => {
    assert.equal(
      findReusableClient([ana], { name: "Pedro Soto", phone: "+56911111111", email: "ana@test.cl" }),
      null,
    );
  });

  it("does not match on name alone", () => {
    assert.equal(
      findReusableClient([ana], { name: "Ana Pérez", phone: "+56922222222", email: "otra@test.cl" }),
      null,
    );
  });
});

describe("missingContactFields", () => {
  it("never overwrites existing phone or email", () => {
    assert.deepEqual(missingContactFields(ana, { phone: "+56999999999", email: "x@test.cl" }), {});
  });

  it("fills blanks", () => {
    assert.deepEqual(
      missingContactFields({ phone: "+56911111111", email: null }, { phone: "+56911111111", email: "a@test.cl" }),
      { email: "a@test.cl" },
    );
  });
});
