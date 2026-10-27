"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { backWithError, backWithOk, errorMessage, optStr, str } from "@/components/admin/form";
import { requireAdminAction } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { normalizeUsPhone } from "@/lib/phone";
import { subscribe, type SubscribeOutcome } from "@/lib/subscribers";

const LIST = "/admin/subscribers";

const addSchema = z.object({
  name: z.string().trim().max(80).nullable(),
  phone: z.string().trim().max(32).nullable(),
  email: z.string().trim().toLowerCase().max(120).nullable(),
  source: z.enum(["IN_STORE", "PHONE"]),
  note: z.string().trim().max(500).nullable(),
});

/** What we tell the admin after a sign-up so they can tell the customer. */
function describe(outcome: SubscribeOutcome, name: string | null): string {
  const who = name || outcome.subscriber.phone || outcome.subscriber.email || "They";
  if (outcome.alreadyActive) return `${who} is already confirmed. Nothing to do.`;
  const parts: string[] = [];
  if (outcome.smsRequested) parts.push(outcome.smsSent ? `we texted them "Reply YES" to confirm texts` : `texting isn't set up, so no confirmation text went out (they stay pending)`);
  if (outcome.emailRequested) parts.push(outcome.emailSent ? `we emailed them a confirmation link` : `email isn't set up, so no confirmation email went out (they stay pending)`);
  return `${who} added: ${parts.join("; ")}.`;
}

export async function addSubscriber(formData: FormData): Promise<void> {
  const admin = await requireAdminAction();
  const parsed = addSchema.safeParse({
    name: optStr(formData, "name"),
    phone: optStr(formData, "phone"),
    email: optStr(formData, "email"),
    source: str(formData, "source") || "IN_STORE",
    note: optStr(formData, "note"),
  });
  if (!parsed.success) backWithError(LIST, "Check the form: pick where they asked, keep the note short.");
  const { name, phone, email, source, note } = parsed.data;

  const normalizedPhone = phone ? normalizeUsPhone(phone) : null;
  if (phone && !normalizedPhone) backWithError(LIST, "That doesn't look like a US mobile number. Try (660) 555-0123.");
  if (email && !z.string().email().safeParse(email).success) backWithError(LIST, "That email address doesn't look right.");
  if (!normalizedPhone && !email) backWithError(LIST, "Enter a mobile number or an email.");

  // redirect() throws, so the success redirect stays outside the try.
  let outcome: SubscribeOutcome;
  try {
    outcome = await subscribe({
      name,
      phone: normalizedPhone,
      email,
      source,
      consentNote: `Added by ${admin.email} (${source}); customer asked ${source === "PHONE" ? "by phone" : "in person"}.${note ? ` Note: ${note}` : ""}`,
    });
    if (note) await prisma.subscriber.update({ where: { id: outcome.subscriber.id }, data: { notes: note } });
  } catch (error) {
    backWithError(LIST, `Couldn't add them: ${errorMessage(error)}`);
  }
  backWithOk(LIST, describe(outcome, name));
}

/** Re-run the sign-up with the row's own data so a fresh YES text / confirm email goes out. */
export async function resendConfirmation(formData: FormData): Promise<void> {
  const admin = await requireAdminAction();
  const id = str(formData, "id");
  const row = await prisma.subscriber.findUnique({ where: { id } });
  if (!row) backWithError(LIST, "That subscriber no longer exists.");
  let outcome: SubscribeOutcome;
  try {
    outcome = await subscribe({
      name: row.name,
      phone: row.smsStatus === "ACTIVE" ? null : row.phone,
      email: row.emailStatus === "ACTIVE" ? null : row.email,
      source: row.consentSource,
      consentNote: `${row.consentNote ?? ""} Confirmation re-sent by ${admin.email}.`.trim(),
    });
  } catch (error) {
    backWithError(LIST, `Couldn't resend: ${errorMessage(error)}`);
  }
  backWithOk(LIST, describe(outcome, row.name));
}

export async function stopChannel(formData: FormData): Promise<void> {
  const admin = await requireAdminAction();
  const id = str(formData, "id");
  const channel = str(formData, "channel");
  if (channel !== "sms" && channel !== "email") backWithError(LIST, "Unknown channel.");
  const row = await prisma.subscriber.findUnique({ where: { id } });
  if (!row) backWithError(LIST, "That subscriber no longer exists.");
  await prisma.subscriber.update({
    where: { id },
    data: {
      ...(channel === "sms" ? { smsStatus: "STOPPED" } : { emailStatus: "STOPPED" }),
      stoppedAt: new Date(),
      notes: `${row.notes ? `${row.notes}\n` : ""}${channel === "sms" ? "Texts" : "Emails"} stopped by ${admin.email} on ${new Date().toISOString().slice(0, 10)}.`,
    },
  });
  backWithOk(LIST, `${row.name || row.phone || row.email} won't get ${channel === "sms" ? "texts" : "emails"} anymore.`);
}

export async function removeSubscriber(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = str(formData, "id");
  const row = await prisma.subscriber.findUnique({ where: { id }, select: { name: true, phone: true, email: true } });
  if (!row) redirect(LIST);
  await prisma.subscriber.delete({ where: { id } });
  backWithOk(LIST, `Removed ${row.name || row.phone || row.email}.`);
}
