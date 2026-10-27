import { SITE } from "@/lib/site";

/**
 * "Open now" for the header. The owners edit hours as text; this reads the
 * common shapes ("Mon–Fri 8:00–5:00", "Sat 8–12", "Sun closed"). Anything it
 * cannot read is treated as closed, so the dot never lies green.
 */

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

type Range = { open: number; close: number } | null;

function parseTime(text: string, isClose: boolean): number | null {
  const m = text.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2] ?? 0);
  const ampm = m[3];
  if (ampm === "pm" && hour < 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;
  // "8–5" with no am/pm: a closing hour before the opening one is afternoon.
  if (!ampm && isClose && hour < 8) hour += 12;
  return hour * 60 + minute;
}

function dayIndex(token: string): number {
  return DAYS.indexOf(token.trim().toLowerCase().slice(0, 3));
}

/** Weekly ranges by day index (0 = Sunday). */
export function parseHours(text: string): Range[] {
  const week: Range[] = Array.from({ length: 7 }, () => null);
  for (const raw of text.split(/\n|·/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^([a-z]{3,9})(?:\s*[–-]\s*([a-z]{3,9}))?\s+(.*)$/i);
    if (!m) continue;
    const from = dayIndex(m[1]);
    const to = m[2] ? dayIndex(m[2]) : from;
    if (from < 0 || to < 0) continue;
    const rest = m[3].trim();
    let range: Range = null;
    if (!/closed/i.test(rest)) {
      const parts = rest.split(/\s*[–-]\s*/);
      if (parts.length === 2) {
        const open = parseTime(parts[0], false);
        const close = parseTime(parts[1], true);
        if (open !== null && close !== null) range = { open, close };
      }
    }
    for (let d = from; ; d = (d + 1) % 7) {
      week[d] = range;
      if (d === to) break;
    }
  }
  return week;
}

export function isOpenNow(hoursText: string, now = new Date()): boolean {
  const week = parseHours(hoursText);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: SITE.timeZone, weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const range = week[dayIndex(weekday)];
  if (!range) return false;
  const minutes = hour * 60 + minute;
  return minutes >= range.open && minutes < range.close;
}
