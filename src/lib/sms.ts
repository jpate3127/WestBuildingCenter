import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Twilio, through its REST API (no SDK). Env:
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and one of
 *   TWILIO_MESSAGING_SERVICE_SID (preferred once A2P 10DLC is approved) or
 *   TWILIO_FROM (the phone number, E.164).
 * Unconfigured: sends are logged, not sent, and the admin shows what is missing.
 */

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function smsConfig(): { ok: true; sid: string; token: string; from: { MessagingServiceSid: string } | { From: string } } | { ok: false; missing: string[] } {
  const missing: string[] = [];
  const sid = env("TWILIO_ACCOUNT_SID");
  const token = env("TWILIO_AUTH_TOKEN");
  const service = env("TWILIO_MESSAGING_SERVICE_SID");
  const from = env("TWILIO_FROM");
  if (!sid) missing.push("TWILIO_ACCOUNT_SID");
  if (!token) missing.push("TWILIO_AUTH_TOKEN");
  if (!service && !from) missing.push("TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM");
  if (missing.length) return { ok: false, missing };
  return { ok: true, sid, token, from: service ? { MessagingServiceSid: service } : { From: from } };
}

export function isSmsConfigured(): boolean {
  return smsConfig().ok;
}

export type SendResult = { ok: true; id: string | null } | { ok: false; error: string };

export async function sendSms(to: string, body: string): Promise<SendResult> {
  const config = smsConfig();
  if (!config.ok) {
    console.info(`[sms] not configured (${config.missing.join(", ")}); would send to ${to}: ${body}`);
    return { ok: false, error: `SMS not configured: ${config.missing.join(", ")}` };
  }
  const params = new URLSearchParams({ To: to, Body: body, ...config.from });
  const statusCallback = env("TWILIO_STATUS_CALLBACK");
  if (statusCallback) params.set("StatusCallback", statusCallback);
  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.sid}:${config.token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const json = (await response.json().catch(() => ({}))) as { sid?: string; message?: string; code?: number };
    if (!response.ok) return { ok: false, error: json.message ? `${json.message} (${json.code ?? response.status})` : `HTTP ${response.status}` };
    return { ok: true, id: json.sid ?? null };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Twilio signs webhooks: HMAC-SHA1 of the full URL plus the POST params
 * (sorted by key, values appended), base64, in X-Twilio-Signature.
 */
export function validTwilioSignature(url: string, params: Record<string, string>, signature: string | null): boolean {
  const token = env("TWILIO_AUTH_TOKEN");
  if (!token || !signature) return false;
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const expected = createHmac("sha1", token).update(data).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Keywords carriers require every sender to honor. */
export function classifyInbound(body: string): "STOP" | "START" | "HELP" | "YES" | "OTHER" {
  const word = body.trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"].includes(word)) return "STOP";
  if (["START", "UNSTOP", "SUBSCRIBE"].includes(word)) return "START";
  if (["HELP", "INFO"].includes(word)) return "HELP";
  if (["YES", "Y", "YEP", "YEAH", "CONFIRM", "OK", "OKAY"].includes(word)) return "YES";
  return "OTHER";
}
