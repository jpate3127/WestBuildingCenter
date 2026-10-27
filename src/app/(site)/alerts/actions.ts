"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { normalizeUsPhone } from "@/lib/phone";
import { rateLimited } from "@/lib/rateLimit";
import { subscribe } from "@/lib/subscribers";

export type AlertSignupState = {
  status: "idle" | "ok" | "error";
  message?: string;
  /** What the person should do next. */
  smsPending?: boolean;
  emailPending?: boolean;
};

const schema = z.object({
  name: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(32).optional(),
  email: z.string().trim().toLowerCase().max(120).optional(),
  website: z.string().max(0).optional(), // honeypot
  consent: z.literal("on", { error: "Please check the box to agree to receive texts." }).optional(),
});

export async function signUpForAlerts(_prev: AlertSignupState, formData: FormData): Promise<AlertSignupState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Please check the form and try again." };
  const { name, phone, email, website } = parsed.data;
  if (website) return { status: "ok", smsPending: Boolean(phone), emailPending: Boolean(email) }; // bot: pretend

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(`alerts:${ip}`, 8, 10 * 60 * 1000)) return { status: "error", message: "Too many sign-ups from this connection. Try again in a few minutes." };

  const normalizedPhone = phone ? normalizeUsPhone(phone) : null;
  if (phone && !normalizedPhone) return { status: "error", message: "That doesn't look like a US mobile number. Try (660) 555-0123." };
  const validEmail = email ? z.string().email().safeParse(email).success : false;
  if (email && !validEmail) return { status: "error", message: "That email address doesn't look right." };
  if (!normalizedPhone && !validEmail) return { status: "error", message: "Enter a mobile number or an email." };
  if (normalizedPhone && parsed.data.consent !== "on") return { status: "error", message: "Please check the box to agree to receive texts." };

  try {
    const outcome = await subscribe({
      name,
      phone: normalizedPhone,
      email: validEmail ? email : null,
      source: "WEB",
      consentNote: `Web form; checkbox consent to recurring promotional texts/emails. IP ${ip}.`,
    });
    if (outcome.alreadyActive) return { status: "ok", message: "You're already signed up. We'll text or email you when the next deal lands." };
    return { status: "ok", smsPending: outcome.smsRequested, emailPending: outcome.emailRequested };
  } catch (error) {
    console.error("[alerts] sign-up failed", error);
    return { status: "error", message: "Something went wrong on our end. Call us and we'll add you by hand." };
  }
}
