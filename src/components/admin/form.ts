import { redirect } from "next/navigation";

import { SITE } from "@/lib/site";

/**
 * Small helpers the admin server actions share: pulling typed values out of
 * FormData, money and date conversions, and the "go back with a message"
 * redirect every form uses instead of an error boundary.
 */

export const MAX_FILES_PER_SUBMIT = 8;

export function str(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Trimmed string, or null when blank. */
export function optStr(formData: FormData, name: string): string | null {
  return str(formData, name) || null;
}

export function checked(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

/** Uploaded files with content, capped so one tap can't send 40 photos. */
export function files(formData: FormData, name: string): File[] {
  return formData
    .getAll(name)
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, MAX_FILES_PER_SUBMIT);
}

/** "$1,750" or "389.00" → cents; blank → null; garbage → NaN. */
export function parseDollars(text: string): number | null {
  const cleaned = text.replace(/[$,\s]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) : Number.NaN;
}

export function centsToInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}

const dateParts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: SITE.timeZone });
const timeParts = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: SITE.timeZone });

/** "2026-11-07" in the store's time zone, for <input type="date">. */
export function toDateInput(d: Date | null | undefined): string {
  return d ? dateParts.format(d) : "";
}

/** "08:00" in the store's time zone, for <input type="time">. */
export function toTimeInput(d: Date | null | undefined): string {
  return d ? timeParts.format(d).replace("24:", "00:") : "";
}

export function isDateInput(text: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(text);
}

export function isTimeInput(text: string): boolean {
  return /^\d{2}:\d{2}$/.test(text);
}

/** Start of the day in the store's time zone (the server runs with TZ=America/Chicago). */
export function startOfDayInput(dateInput: string): Date {
  return new Date(`${dateInput}T00:00:00`);
}

export function dateTimeInput(dateInput: string, timeInput: string): Date {
  return new Date(`${dateInput}T${timeInput}:00`);
}

/** Back to the form with the problem in the URL; the page shows it as a Notice. */
export function backWithError(path: string, message: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
}

export function backWithOk(path: string, message: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}ok=${encodeURIComponent(message)}`);
}

export function firstLine(text: string | null | undefined, max = 90): string {
  const line = (text ?? "").split("\n").find((l) => l.trim()) ?? "";
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
