import { getAdmin } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatUsPhone } from "@/lib/phone";

/** Every subscriber as a spreadsheet, for the owners' records. Admins only. */
export async function GET(): Promise<Response> {
  const admin = await getAdmin();
  if (!admin) return Response.json({ error: "Sign in required." }, { status: 401 });

  const rows = await prisma.subscriber.findMany({ orderBy: { createdAt: "asc" } });
  const header = ["Name", "Phone", "Email", "Texts", "Email status", "Source", "Consent at", "Consent note", "Texts confirmed", "Email confirmed", "Stopped", "Joined", "Notes"];
  const cell = (value: unknown): string => {
    const text = value instanceof Date ? value.toISOString() : value === null || value === undefined ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = rows.map((s) =>
    [s.name, formatUsPhone(s.phone), s.email, s.smsStatus, s.emailStatus, s.consentSource, s.consentAt, s.consentNote, s.smsConfirmedAt, s.emailConfirmedAt, s.stoppedAt, s.createdAt, s.notes].map(cell).join(","),
  );
  // A BOM so Excel opens it as UTF-8 (names with accents, en dashes in notes).
  const body = `﻿${[header.join(","), ...lines].join("\r\n")}\r\n`;
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="wbc-subscribers-${stamp}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
