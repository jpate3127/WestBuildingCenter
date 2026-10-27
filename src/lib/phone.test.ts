import assert from "node:assert/strict";
import { test } from "node:test";

import { formatUsPhone, normalizeUsPhone } from "./phone";

test("normalizes the ways people type a number", () => {
  assert.equal(normalizeUsPhone("(660) 239-4444"), "+16602394444");
  assert.equal(normalizeUsPhone("660.239.4444"), "+16602394444");
  assert.equal(normalizeUsPhone("1 660 239 4444"), "+16602394444");
  assert.equal(normalizeUsPhone("+1 660-239-4444"), "+16602394444");
});

test("rejects numbers that cannot be US phones", () => {
  assert.equal(normalizeUsPhone("239-4444"), null);
  assert.equal(normalizeUsPhone("066 239 4444"), null);
  assert.equal(normalizeUsPhone("hello"), null);
});

test("formats for display", () => {
  assert.equal(formatUsPhone("+16602394444"), "(660) 239-4444");
  assert.equal(formatUsPhone(null), "");
});
