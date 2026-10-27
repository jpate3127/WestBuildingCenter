import assert from "node:assert/strict";
import { test } from "node:test";

import { fmtDateRange, fmtEventWhen, formatMoney, isActive } from "./format";

test("money reads like a price tag", () => {
  assert.equal(formatMoney(39900), "$399");
  assert.equal(formatMoney(19999), "$199.99");
  assert.equal(formatMoney(395000), "$3,950");
  assert.equal(formatMoney(null), "Call for price");
  assert.equal(formatMoney(7999, "and up"), "$79.99 and up");
});

test("date ranges in the store's time zone", () => {
  const start = new Date("2026-11-02T06:00:00Z");
  const end = new Date("2027-02-01T05:59:59Z"); // Jan 31 23:59:59 Central
  assert.equal(fmtDateRange(start, end), "Nov 2, 2026 – Jan 31, 2027");
  assert.equal(fmtDateRange(null, end), "Through Jan 31, 2027");
  assert.equal(fmtDateRange(null, null), "");
});

test("event times collapse to one line", () => {
  const start = new Date("2026-11-13T14:00:00Z"); // 8am CST
  const end = new Date("2026-11-13T18:00:00Z"); // 12pm CST
  assert.equal(fmtEventWhen(start, end), "Friday, November 13 · 8am–12pm");
  assert.equal(fmtEventWhen(null, null), "Date to be announced");
});

test("active means inside the window", () => {
  const now = new Date("2026-12-01T12:00:00Z");
  assert.equal(isActive(now, new Date("2026-11-01"), new Date("2027-01-31")), true);
  assert.equal(isActive(now, new Date("2026-12-15"), null), false);
  assert.equal(isActive(now, null, new Date("2026-11-30")), false);
});
