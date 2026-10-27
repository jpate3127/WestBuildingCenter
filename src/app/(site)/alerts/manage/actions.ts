"use server";

import { z } from "zod";

import { TOO_MANY_MESSAGE, tooManyForms } from "@/app/(site)/formUtils";
import { GENERIC_FORM_ERROR, type FormState } from "@/components/site/formState";
import { stopByToken } from "@/lib/subscribers";

const schema = z.object({
  token: z.string().trim().min(8).max(200),
  sms: z.literal("on").optional(),
  email: z.literal("on").optional(),
});

/** The manage page: stop texts, emails or both for the person behind the token. */
export async function stopChannels(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse({ token: formData.get("token"), sms: formData.get("sms") || undefined, email: formData.get("email") || undefined });
  if (!parsed.success) return { status: "error", message: "That link isn't valid. Open the manage link from one of our emails and try again." };
  const { token, sms, email } = parsed.data;
  if (!sms && !email) return { status: "error", message: "Tick what you want to stop first." };
  if (await tooManyForms("manage", 10)) return { status: "error", message: TOO_MANY_MESSAGE };

  try {
    const subscriber = await stopByToken(token, { sms: Boolean(sms), email: Boolean(email) });
    if (!subscriber) return { status: "error", message: "That link isn't valid. Open the manage link from one of our emails and try again." };
    const stopped = [sms && subscriber.phone ? "texts" : null, email && subscriber.email ? "emails" : null].filter(Boolean);
    return { status: "ok", message: stopped.length ? `Done. No more ${stopped.join(" or ")} from us.` : "Nothing to stop on that channel." };
  } catch (error) {
    console.error("[alerts] manage failed", error);
    return { status: "error", message: GENERIC_FORM_ERROR };
  }
}

/** The unsubscribe page and the one-click header: stop everything. */
export async function stopEverything(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = formData.get("token");
  if (typeof token !== "string" || token.length < 8) return { status: "error", message: "That link isn't valid." };
  if (await tooManyForms("unsubscribe", 10)) return { status: "error", message: TOO_MANY_MESSAGE };
  try {
    const subscriber = await stopByToken(token, { sms: true, email: true });
    if (!subscriber) return { status: "error", message: "That link isn't valid." };
    return { status: "ok", message: "You're unsubscribed. No more texts or emails from us." };
  } catch (error) {
    console.error("[alerts] unsubscribe failed", error);
    return { status: "error", message: GENERIC_FORM_ERROR };
  }
}
