"use server";

import { z } from "zod";

import { TOO_MANY_MESSAGE, fieldErrors, isBot, tooManyForms } from "@/app/(site)/formUtils";
import { GENERIC_FORM_ERROR, type FormState } from "@/components/site/formState";
import { prisma } from "@/lib/db";
import { notifyStore } from "@/lib/notify";
import { normalizeUsPhone } from "@/lib/phone";
import { after } from "next/server";

const CHECK = "Please check the highlighted fields.";

const base = {
  company: z.string().trim().min(2, "Company or farm name, please.").max(120),
  name: z.string().trim().min(2, "Who should we ask for?").max(80),
  phone: z.string().trim().min(7, "We need a phone number.").max(32),
  email: z.string().trim().toLowerCase().max(120).optional(),
};

const quoteSchema = z.object({
  ...base,
  message: z.string().trim().min(3, "Paste the part numbers or list you want priced.").max(8000),
  reach: z.enum(["Call", "Text", "Email"], { error: "How should we reach you?" }),
});

const accountSchema = z.object({
  ...base,
  message: z.string().trim().max(2000).optional(),
});

/** Phone + optional email, normalized, or the field errors to show. */
function contactFields(phone: string, email: string | undefined): { ok: true; phone: string; email: string | null } | { ok: false; errors: Record<string, string> } {
  const normalized = normalizeUsPhone(phone);
  if (!normalized) return { ok: false, errors: { phone: "That doesn't look like a US phone number. Try (660) 555-0123." } };
  if (email) {
    const parsed = z.email().safeParse(email);
    if (!parsed.success) return { ok: false, errors: { email: "That email address doesn't look right." } };
    return { ok: true, phone: normalized, email: parsed.data };
  }
  return { ok: true, phone: normalized, email: null };
}

export async function requestQuote(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { status: "ok" };
  const parsed = quoteSchema.safeParse({
    company: formData.get("company"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    message: formData.get("message"),
    reach: formData.get("reach"),
  });
  if (!parsed.success) return { status: "error", message: CHECK, errors: fieldErrors(parsed.error) };
  const contact = contactFields(parsed.data.phone, parsed.data.email);
  if (!contact.ok) return { status: "error", message: CHECK, errors: contact.errors };
  if (await tooManyForms("quote", 6)) return { status: "error", message: TOO_MANY_MESSAGE };

  try {
    const inquiry = await prisma.inquiry.create({
      data: {
        type: "QUOTE",
        company: parsed.data.company,
        name: parsed.data.name,
        phone: contact.phone,
        email: contact.email,
        message: parsed.data.message,
        meta: { reach: parsed.data.reach },
      },
    });
    after(() =>
      notifyStore({
        subject: `Business quote request from ${parsed.data.company}`,
        fields: [["Company", parsed.data.company], ["Name", parsed.data.name], ["Phone", contact.phone], ["Email", contact.email], ["Best way to reach", parsed.data.reach], ["List", parsed.data.message]],
        adminPath: `/admin/inquiries/${inquiry.id}`,
        replyTo: contact.email,
      }),
    );
    return { status: "ok" };
  } catch (error) {
    console.error("[business] quote failed", error);
    return { status: "error", message: GENERIC_FORM_ERROR };
  }
}

export async function openAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { status: "ok" };
  const parsed = accountSchema.safeParse({
    company: formData.get("company"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    message: formData.get("message") || undefined,
  });
  if (!parsed.success) return { status: "error", message: CHECK, errors: fieldErrors(parsed.error) };
  const contact = contactFields(parsed.data.phone, parsed.data.email);
  if (!contact.ok) return { status: "error", message: CHECK, errors: contact.errors };
  if (await tooManyForms("account", 4)) return { status: "error", message: TOO_MANY_MESSAGE };

  try {
    const inquiry = await prisma.inquiry.create({
      data: {
        type: "ACCOUNT",
        company: parsed.data.company,
        name: parsed.data.name,
        phone: contact.phone,
        email: contact.email,
        message: parsed.data.message || "Wants to open a business account.",
      },
    });
    after(() =>
      notifyStore({
        subject: `Business account request from ${parsed.data.company}`,
        fields: [["Company", parsed.data.company], ["Name", parsed.data.name], ["Phone", contact.phone], ["Email", contact.email], ["Message", parsed.data.message]],
        adminPath: `/admin/inquiries/${inquiry.id}`,
        replyTo: contact.email,
      }),
    );
    return { status: "ok" };
  } catch (error) {
    console.error("[business] account failed", error);
    return { status: "error", message: GENERIC_FORM_ERROR };
  }
}
