"use server";

import { z } from "zod";

import { TOO_MANY_MESSAGE, fieldErrors, isBot, tooManyForms } from "@/app/(site)/formUtils";
import { GENERIC_FORM_ERROR, type FormState } from "@/components/site/formState";
import { prisma } from "@/lib/db";
import { notifyStore } from "@/lib/notify";
import { normalizeUsPhone } from "@/lib/phone";
import { after } from "next/server";

const schema = z.object({
  name: z.string().trim().min(2, "Please tell us your name.").max(80),
  contact: z.string().trim().min(5, "A phone number or email so we can answer.").max(120),
  message: z.string().trim().min(5, "What can we help with?").max(4000),
});

export async function sendContact(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { status: "ok" };
  const parsed = schema.safeParse({ name: formData.get("name"), contact: formData.get("contact"), message: formData.get("message") });
  if (!parsed.success) return { status: "error", message: "Please check the highlighted fields.", errors: fieldErrors(parsed.error) };

  // One box for phone or email: keep whichever it is in its own column.
  const raw = parsed.data.contact;
  const phone = normalizeUsPhone(raw);
  const email = !phone && z.email().safeParse(raw.toLowerCase()).success ? raw.toLowerCase() : null;
  if (!phone && !email) return { status: "error", message: "Please check the highlighted fields.", errors: { contact: "Enter a phone number like (660) 555-0123 or an email address." } };

  if (await tooManyForms("contact", 6)) return { status: "error", message: TOO_MANY_MESSAGE };

  try {
    const inquiry = await prisma.inquiry.create({ data: { type: "CONTACT", name: parsed.data.name, phone, email, message: parsed.data.message } });
    after(() =>
      notifyStore({
        subject: `Message from ${parsed.data.name}`,
        fields: [["Name", parsed.data.name], ["Phone", phone], ["Email", email], ["Message", parsed.data.message]],
        adminPath: `/admin/inquiries/${inquiry.id}`,
        replyTo: email,
      }),
    );
    return { status: "ok" };
  } catch (error) {
    console.error("[contact] submit failed", error);
    return { status: "error", message: GENERIC_FORM_ERROR };
  }
}
