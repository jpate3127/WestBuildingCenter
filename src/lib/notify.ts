import { getContent } from "@/lib/content";
import { escapeHtml, sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site";

/**
 * "Something came in" email to the store (ContentBlock store.email) whenever
 * a form is submitted, so nobody has to remember to check the admin inbox.
 * Quiet when email is not configured; never throws into the form.
 */

export type StoreNotice = {
  subject: string;
  /** Label/value pairs shown in the email. */
  fields: Array<[string, string | null | undefined]>;
  /** Where to look in the admin. */
  adminPath: string;
  /** The customer's email, so Reply goes to them. */
  replyTo?: string | null;
};

export async function notifyStore(notice: StoreNotice): Promise<void> {
  try {
    const content = await getContent();
    const to = content["store.email"].trim();
    if (!to) return;
    const rows = notice.fields.filter(([, value]) => value && String(value).trim());
    const link = siteUrl(notice.adminPath);
    const text = [...rows.map(([label, value]) => `${label}: ${value}`), "", `Open in admin: ${link}`].join("\n");
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#161616">
<h2 style="margin:0 0 12px;font-size:18px">${escapeHtml(notice.subject)}</h2>
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows
      .map(([label, value]) => `<tr><td style="padding:4px 12px 4px 0;color:#555;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:4px 0;white-space:pre-wrap">${escapeHtml(String(value))}</td></tr>`)
      .join("")}</table>
<p style="margin:16px 0 0"><a href="${link}" style="display:inline-block;background:#161616;color:#fff;padding:10px 16px;border-radius:4px;text-decoration:none;font-weight:bold">Open in admin</a></p>
</div>`;
    await sendEmail({ to, subject: `[WBC website] ${notice.subject}`, html, text, replyTo: notice.replyTo ?? undefined });
  } catch (error) {
    console.error("[notify] store email failed", error);
  }
}
