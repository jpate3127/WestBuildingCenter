import { NextResponse, type NextRequest } from "next/server";

import { siteUrl } from "@/lib/site";
import { validTwilioSignature } from "@/lib/sms";
import { handleInboundSms } from "@/lib/subscribers";

/**
 * Twilio posts every inbound text here (set this URL on the number or the
 * Messaging Service: "A message comes in" → <SITE_URL>/api/twilio/inbound).
 * STOP/START/YES/HELP update the subscriber; the reply goes back as TwiML.
 */

function twiml(message: string | null): NextResponse {
  const body = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] ?? c)}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
  return new NextResponse(body, { headers: { "Content-Type": "text/xml" } });
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of form.entries()) if (typeof value === "string") params[key] = value;

  // Twilio signs the public URL it was given, which is this route on SITE_URL.
  const signedUrl = siteUrl("/api/twilio/inbound");
  if (!validTwilioSignature(signedUrl, params, request.headers.get("x-twilio-signature"))) {
    return NextResponse.json({ error: "Bad signature" }, { status: 403 });
  }

  const from = params.From ?? "";
  const body = params.Body ?? "";
  if (!from) return twiml(null);
  const reply = await handleInboundSms(from, body);
  return twiml(reply);
}
