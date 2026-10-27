import type { ConsentSource, Subscriber } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { escapeHtml, sendEmail } from "@/lib/email";
import { newToken } from "@/lib/tokens";
import { SITE, siteUrl } from "@/lib/site";
import { classifyInbound, sendSms } from "@/lib/sms";

/**
 * Deal-alert subscriptions. One Subscriber per person; each channel on the
 * row goes NONE → PENDING (asked to confirm) → ACTIVE → STOPPED.
 *
 * Texts need a YES reply (double opt-in) whether the person signed up on the
 * site or the owner typed them in at the counter. Email needs a click on the
 * confirmation link. STOP by text and the unsubscribe link both work without
 * anyone signing in.
 */

export const SMS_CONFIRM_TEXT = `${SITE.name}: Reply YES to get Milwaukee deal alerts by text (about 2-4 msgs/mo). Msg & data rates may apply. Reply STOP to opt out, HELP for help.`;
export const SMS_WELCOME_TEXT = `${SITE.name}: You're in! We'll text you when new deals and events land. Reply STOP anytime.`;
export const SMS_STOP_TEXT = `${SITE.name}: You're unsubscribed and won't get more texts. Reply START to rejoin. Questions? ${SITE.phoneDisplay}`;
export const SMS_HELP_TEXT = `${SITE.name} deal alerts: about 2-4 msgs/mo. Reply STOP to cancel. Call us at ${SITE.phoneDisplay}. Msg & data rates may apply.`;
export const SMS_OTHER_TEXT = `Thanks for texting ${SITE.name}! This number only sends deal alerts. For questions call ${SITE.phoneDisplay} (${SITE.address.street}, ${SITE.address.city}).`;

export type SubscribeInput = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  source: ConsentSource;
  consentNote: string;
};

export type SubscribeOutcome = {
  subscriber: Subscriber;
  smsRequested: boolean;
  emailRequested: boolean;
  smsSent: boolean;
  emailSent: boolean;
  alreadyActive: boolean;
};

/** Create or update the person and send whichever confirmations they need. */
export async function subscribe(input: SubscribeInput): Promise<SubscribeOutcome> {
  const phone = input.phone?.trim() || null;
  const email = input.email?.trim().toLowerCase() || null;
  if (!phone && !email) throw new Error("A phone number or email is required.");

  const existing = await prisma.subscriber.findFirst({
    where: { OR: [...(phone ? [{ phone }] : []), ...(email ? [{ email }] : [])] },
  });

  const now = new Date();
  const smsRequested = Boolean(phone) && existing?.smsStatus !== "ACTIVE";
  const emailRequested = Boolean(email) && existing?.emailStatus !== "ACTIVE";

  const data = {
    name: input.name?.trim() || existing?.name || null,
    phone: phone ?? existing?.phone ?? null,
    email: email ?? existing?.email ?? null,
    smsStatus: phone ? (existing?.smsStatus === "ACTIVE" ? "ACTIVE" : "PENDING") : (existing?.smsStatus ?? "NONE"),
    emailStatus: email ? (existing?.emailStatus === "ACTIVE" ? "ACTIVE" : "PENDING") : (existing?.emailStatus ?? "NONE"),
    consentSource: input.source,
    consentAt: now,
    consentNote: input.consentNote,
  } as const;

  const subscriber = existing
    ? await prisma.subscriber.update({ where: { id: existing.id }, data })
    : await prisma.subscriber.create({ data: { ...data, manageToken: newToken() } });

  let smsSent = false;
  let emailSent = false;
  if (smsRequested && subscriber.phone) smsSent = (await sendSms(subscriber.phone, SMS_CONFIRM_TEXT)).ok;
  if (emailRequested && subscriber.email) emailSent = (await sendConfirmEmail(subscriber)).ok;

  return { subscriber, smsRequested, emailRequested, smsSent, emailSent, alreadyActive: !smsRequested && !emailRequested };
}

export function manageUrl(subscriber: Pick<Subscriber, "manageToken">): string {
  return siteUrl(`/alerts/manage?token=${subscriber.manageToken}`);
}

export function unsubscribeUrl(subscriber: Pick<Subscriber, "manageToken">): string {
  return siteUrl(`/alerts/unsubscribe?token=${subscriber.manageToken}`);
}

async function sendConfirmEmail(subscriber: Subscriber) {
  const confirm = siteUrl(`/alerts/confirm?token=${subscriber.manageToken}`);
  const text = `Confirm your ${SITE.name} deal alerts by opening this link: ${confirm}\n\nIf you didn't sign up, ignore this email.`;
  const html = `<p style="font-family:sans-serif;font-size:16px">Confirm your <strong>${escapeHtml(SITE.name)}</strong> deal alerts:</p>
<p><a href="${confirm}" style="display:inline-block;background:#C8102E;color:#fff;padding:14px 22px;border-radius:4px;text-decoration:none;font-weight:bold;font-family:sans-serif">Yes, send me deals</a></p>
<p style="font-family:sans-serif;font-size:13px;color:#555">If you didn't sign up, ignore this email.</p>`;
  return sendEmail({ to: subscriber.email!, subject: `Confirm your ${SITE.name} deal alerts`, html, text });
}

export async function confirmEmailByToken(token: string): Promise<Subscriber | null> {
  const subscriber = await prisma.subscriber.findUnique({ where: { manageToken: token } });
  if (!subscriber || !subscriber.email) return null;
  if (subscriber.emailStatus === "ACTIVE") return subscriber;
  return prisma.subscriber.update({ where: { id: subscriber.id }, data: { emailStatus: "ACTIVE", emailConfirmedAt: new Date() } });
}

export async function findByToken(token: string): Promise<Subscriber | null> {
  if (!token) return null;
  return prisma.subscriber.findUnique({ where: { manageToken: token } });
}

/** Unsubscribe link or manage page: stop one or both channels. */
export async function stopByToken(token: string, channels: { sms?: boolean; email?: boolean }): Promise<Subscriber | null> {
  const subscriber = await prisma.subscriber.findUnique({ where: { manageToken: token } });
  if (!subscriber) return null;
  const now = new Date();
  return prisma.subscriber.update({
    where: { id: subscriber.id },
    data: {
      ...(channels.sms && subscriber.phone ? { smsStatus: "STOPPED" } : {}),
      ...(channels.email && subscriber.email ? { emailStatus: "STOPPED" } : {}),
      stoppedAt: now,
    },
  });
}

/** The reply to an inbound text, after recording what it means. */
export async function handleInboundSms(from: string, body: string): Promise<string | null> {
  const kind = classifyInbound(body);
  const subscriber = await prisma.subscriber.findUnique({ where: { phone: from } });
  const now = new Date();
  switch (kind) {
    case "STOP":
      if (subscriber && subscriber.smsStatus !== "STOPPED") {
        await prisma.subscriber.update({ where: { id: subscriber.id }, data: { smsStatus: "STOPPED", stoppedAt: now } });
      }
      // Twilio's own opt-out handling already answers STOP; a second reply would be a violation.
      return null;
    case "YES":
    case "START":
      if (!subscriber) return kind === "START" ? SMS_CONFIRM_TEXT : null;
      if (subscriber.smsStatus === "ACTIVE") return SMS_WELCOME_TEXT;
      await prisma.subscriber.update({ where: { id: subscriber.id }, data: { smsStatus: "ACTIVE", smsConfirmedAt: now } });
      return SMS_WELCOME_TEXT;
    case "HELP":
      return SMS_HELP_TEXT;
    default:
      return SMS_OTHER_TEXT;
  }
}
