import assert from "node:assert/strict";
import { test } from "node:test";

import { isOpenNow, parseHours } from "./hours";

const HOURS = "Mon–Fri 8:00–5:00\nSat 8:00–12:00\nSun closed";

test("parses day ranges and times", () => {
  const week = parseHours(HOURS);
  assert.deepEqual(week[1], { open: 480, close: 1020 });
  assert.deepEqual(week[5], { open: 480, close: 1020 });
  assert.deepEqual(week[6], { open: 480, close: 720 });
  assert.equal(week[0], null);
});

test("knows when the store is open in Missouri", () => {
  // 2026-10-28 is a Wednesday. 10:00 Central = 15:00 UTC (CDT).
  assert.equal(isOpenNow(HOURS, new Date("2026-10-28T15:00:00Z")), true);
  // 18:00 Central = 23:00 UTC.
  assert.equal(isOpenNow(HOURS, new Date("2026-10-28T23:00:00Z")), false);
  // Sunday noon.
  assert.equal(isOpenNow(HOURS, new Date("2026-11-01T17:00:00Z")), false);
});

test("unreadable hours mean closed", () => {
  assert.equal(isOpenNow("Call for hours", new Date()), false);
});
