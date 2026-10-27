import type { Promotion } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { escapeHtml, isEmailConfigured, sendEmail } from "@/lib/email";
import { fmtDateRange, fmtEventWhen } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { SITE, siteUrl } from "@/lib/site";
import { isSmsConfigured, sendSms } from "@/lib/sms";
import { unsubscribeUrl } from "@/lib/subscribers";

/**
 * "Send alert" on a promotion: one Broadcast row per click, texts and emails
 * to every ACTIVE subscriber, counts recorded when done. The admin action
 * creates the row and runs `runBroadcast` after the response (Next's `after`),
 * so a few hundred messages never hold up the page.
 */

export function promotionUrl(promotion: Pick<Promotion, "slug">): string {
  return siteUrl(`/promotions/${promotion.slug}`);
}

/** A text under ~160 characters the owner can edit before sending. */
export function draftSmsText(promotion: Promotion): string {
  const when = promotion.kind === "EVENT" ? fmtEventWhen(promotion.startsAt, promotion.endsAt) : fmtDateRange(promotion.startsAt, promotion.endsAt);
  const lead = promotion.kind === "EVENT" ? "Event" : "New deal";
  const whenPart = when ? ` ${when}.` : "";
  return `${SITE.shortName}: ${lead}! ${promotion.title}.${whenPart} ${promotionUrl(promotion)} Reply STOP to opt out`;
}

export function draftEmailSubject(promotion: Promotion): string {
  return promotion.kind === "EVENT" ? `${promotion.title} at ${SITE.name}` : `New deal: ${promotion.title}`;
}

export async function broadcastPreview(): Promise<{ sms: number; email: number; smsConfigured: boolean; emailConfigured: boolean }> {
  const [sms, email] = await Promise.all([
    prisma.subscriber.count({ where: { smsStatus: "ACTIVE", phone: { not: null } } }),
    prisma.subscriber.count({ where: { emailStatus: "ACTIVE", email: { not: null } } }),
  ]);
  return { sms, email, smsConfigured: isSmsConfigured(), emailConfigured: isEmailConfigured() };
}

export type StartBroadcastInput = {
  promotionId: string;
  sentBy: string;
  smsText: string | null;
  emailSubject: string | null;
};

export async function createBroadcast(input: StartBroadcastInput): Promise<string> {
  const row = await prisma.broadcast.create({
    data: { promotionId: input.promotionId, sentBy: input.sentBy, smsText: input.smsText, emailSubject: input.emailSubject },
    select: { id: true },
  });
  return row.id;
}

async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index++];
      await fn(item);
    }
  });
  await Promise.all(workers);
}

export async function runBroadcast(id: string): Promise<void> {
  const broadcast = await prisma.broadcast.findUnique({ where: { id }, include: { promotion: true } });
  if (!broadcast || broadcast.status !== "QUEUED") return;
  await prisma.broadcast.update({ where: { id }, data: { status: "SENDING", startedAt: new Date() } });

  const counts = { smsSent: 0, smsFailed: 0, emailSent: 0, emailFailed: 0 };
  let error: string | null = null;
  try {
    if (broadcast.smsText) {
      const people = await prisma.subscriber.findMany({ where: { smsStatus: "ACTIVE", phone: { not: null } }, select: { phone: true } });
      await mapLimit(people, 4, async (person) => {
        const result = await sendSms(person.phone!, broadcast.smsText!);
        if (result.ok) counts.smsSent++;
        else {
          counts.smsFailed++;
          if (!error) error = result.error;
        }
      });
    }
    if (broadcast.emailSubject && broadcast.promotion) {
      const promotion = broadcast.promotion;
      const people = await prisma.subscriber.findMany({ where: { emailStatus: "ACTIVE", email: { not: null } }, select: { email: true, manageToken: true } });
      await mapLimit(people, 4, async (person) => {
        const unsubscribe = unsubscribeUrl(person);
        const result = await sendEmail({ ...promotionEmail(promotion, unsubscribe), to: person.email!, subject: broadcast.emailSubject!, unsubscribeUrl: unsubscribe });
        if (result.ok) counts.emailSent++;
        else {
          counts.emailFailed++;
          if (!error) error = result.error;
        }
      });
    }
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
  }

  const total = counts.smsSent + counts.emailSent;
  await prisma.broadcast.update({
    where: { id },
    data: { ...counts, error, status: error && total === 0 ? "FAILED" : "DONE", finishedAt: new Date() },
  });
}

function promotionEmail(promotion: Promotion, unsubscribe: string): { html: string; text: string } {
  const url = promotionUrl(promotion);
  const when = promotion.kind === "EVENT" ? fmtEventWhen(promotion.startsAt, promotion.endsAt) : fmtDateRange(promotion.startsAt, promotion.endsAt);
  const image = promotion.imageKey ? siteUrl(mediaUrl(promotion.imageKey)) : null;
  const text = [
    promotion.title,
    when,
    promotion.summary ?? "",
    "",
    `See it: ${url}`,
    "",
    `${SITE.name} · ${SITE.address.street}, ${SITE.address.city}, ${SITE.address.state} · ${SITE.phoneDisplay}`,
    `Unsubscribe: ${unsubscribe}`,
  ]
    .filter((line) => line !== null)
    .join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#f3f3f3;font-family:Arial,Helvetica,sans-serif;color:#161616">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f3f3;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:6px;overflow:hidden">
<tr><td style="background:#C8102E;color:#ffffff;padding:18px 24px;font-size:20px;font-weight:bold">${escapeHtml(SITE.name)}</td></tr>
${image ? `<tr><td><a href="${url}"><img src="${image}" alt="" width="560" style="display:block;width:100%;height:auto"></a></td></tr>` : ""}
<tr><td style="padding:24px">
<h1 style="margin:0 0 8px;font-size:24px;line-height:1.2">${escapeHtml(promotion.title)}</h1>
${when ? `<p style="margin:0 0 12px;font-weight:bold;color:#444">${escapeHtml(when)}</p>` : ""}
${promotion.summary ? `<p style="margin:0 0 20px;font-size:16px;line-height:1.5">${escapeHtml(promotion.summary)}</p>` : ""}
<a href="${url}" style="display:inline-block;background:#C8102E;color:#ffffff;padding:14px 22px;border-radius:4px;text-decoration:none;font-weight:bold">${promotion.kind === "EVENT" ? "Event details" : "See the flyer"}</a>
<p style="margin:24px 0 0;font-size:14px;color:#555">Call ${escapeHtml(SITE.phoneDisplay)} to hold one. ${escapeHtml(SITE.address.street)}, ${escapeHtml(SITE.address.city)}, ${escapeHtml(SITE.address.state)}.</p>
</td></tr>
<tr><td style="padding:16px 24px;background:#161616;color:#cfcfcf;font-size:12px">You get these because you signed up for ${escapeHtml(SITE.name)} deal alerts. <a href="${unsubscribe}" style="color:#ffffff">Unsubscribe</a></td></tr>
</table></td></tr></table></body></html>`;
  return { html, text };
}
