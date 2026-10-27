import { SITE } from "@/lib/site";

export function formatMoney(cents: number | null | undefined, note?: string | null): string {
  if (cents === null || cents === undefined) return note ?? "Call for price";
  const dollars = cents / 100;
  const text = Number.isInteger(dollars) ? `$${dollars.toLocaleString("en-US")}` : `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return note ? `${text} ${note}` : text;
}

const dateShort = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: SITE.timeZone });
const dateWithYear = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: SITE.timeZone });
const dateLong = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: SITE.timeZone });
const timeShort = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: SITE.timeZone });
const dateTime = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: SITE.timeZone });

export function fmtDate(d: Date | null | undefined, withYear = true): string {
  if (!d) return "";
  return (withYear ? dateWithYear : dateShort).format(d);
}

export function fmtDateLong(d: Date): string {
  return dateLong.format(d);
}

export function fmtTime(d: Date): string {
  return timeShort.format(d).replace(":00", "").toLowerCase().replace(" ", "");
}

export function fmtDateTime(d: Date | null | undefined): string {
  return d ? dateTime.format(d) : "";
}

/** "Nov 2, 2026 – Jan 31, 2027", "Through Jan 31", or "" when undated. */
export function fmtDateRange(start: Date | null | undefined, end: Date | null | undefined): string {
  if (start && end) return `${fmtDate(start)} – ${fmtDate(end)}`;
  if (end) return `Through ${fmtDate(end)}`;
  if (start) return `From ${fmtDate(start)}`;
  return "";
}

/** "Friday, November 7 · 8am–12pm" for an event. */
export function fmtEventWhen(start: Date | null | undefined, end: Date | null | undefined): string {
  if (!start) return "Date to be announced";
  const day = fmtDateLong(start);
  const sameDay = end && dateShort.format(end) === dateShort.format(start);
  if (end && sameDay) return `${day} · ${fmtTime(start)}–${fmtTime(end)}`;
  return `${day} · ${fmtTime(start)}`;
}

export function isActive(now: Date, start: Date | null | undefined, end: Date | null | undefined): boolean {
  if (start && start > now) return false;
  if (end && end < now) return false;
  return true;
}

/** End of the day in the store's time zone, so "ends Jan 31" includes Jan 31. */
export function endOfDayInput(dateInput: string): Date {
  return new Date(`${dateInput}T23:59:59`);
}
