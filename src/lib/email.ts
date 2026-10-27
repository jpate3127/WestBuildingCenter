/**
 * Email through Resend's REST API (no SDK). Env:
 *   RESEND_API_KEY, EMAIL_FROM ("West Building Center <deals@westbuildingcenter.com>")
 * Unconfigured: sends are logged, not sent.
 */

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function emailConfig(): { ok: true; apiKey: string; from: string } | { ok: false; missing: string[] } {
  const missing: string[] = [];
  const apiKey = env("RESEND_API_KEY");
  const from = env("EMAIL_FROM");
  if (!apiKey) missing.push("RESEND_API_KEY");
  if (!from) missing.push("EMAIL_FROM");
  if (missing.length) return { ok: false, missing };
  return { ok: true, apiKey, from };
}

export function isEmailConfigured(): boolean {
  return emailConfig().ok;
}

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** For list mail: one-click unsubscribe headers. */
  unsubscribeUrl?: string;
};

export type SendResult = { ok: true; id: string | null } | { ok: false; error: string };

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const config = emailConfig();
  if (!config.ok) {
    console.info(`[email] not configured (${config.missing.join(", ")}); would send to ${message.to}: ${message.subject}`);
    return { ok: false, error: `Email not configured: ${config.missing.join(", ")}` };
  }
  const headers: Record<string, string> = {};
  if (message.unsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${message.unsubscribeUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: config.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: message.replyTo,
        headers,
      }),
    });
    const json = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!response.ok) return { ok: false, error: json.message ?? `HTTP ${response.status}` };
    return { ok: true, id: json.id ?? null };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}
