"use server";

import { z } from "zod";

import { TOO_MANY_MESSAGE, fieldErrors, isBot, pickUploads, tooManyForms } from "@/app/(site)/formUtils";
import { MAX_ESTIMATE_FILES, TIMELINES } from "@/app/(site)/projects/estimate/constants";
import { GENERIC_FORM_ERROR, type FormState } from "@/components/site/formState";
import { prisma } from "@/lib/db";
import { storeUpload } from "@/lib/images";
import { PROJECT_TYPES } from "@/lib/labels";
import { notifyStore } from "@/lib/notify";
import { normalizeUsPhone } from "@/lib/phone";
import { after } from "next/server";

const schema = z.object({
  name: z.string().trim().min(2, "Please tell us your name.").max(80),
  phone: z.string().trim().min(7, "We need a phone number to call you back.").max(32),
  email: z.string().trim().toLowerCase().max(120).optional(),
  projectType: z.enum(PROJECT_TYPES, { error: "Pick the closest project type." }),
  timeline: z.enum(TIMELINES, { error: "Pick a timeline." }),
  description: z.string().trim().min(10, "Tell us a little about the project (a sentence or two is plenty).").max(4000),
});

export async function submitEstimate(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { status: "ok" };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    projectType: formData.get("projectType"),
    timeline: formData.get("timeline"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { status: "error", message: "Please check the highlighted fields.", errors: fieldErrors(parsed.error) };

  const phone = normalizeUsPhone(parsed.data.phone);
  if (!phone) return { status: "error", message: "Please check the highlighted fields.", errors: { phone: "That doesn't look like a US phone number. Try (660) 555-0123." } };
  const email = parsed.data.email ? z.email().safeParse(parsed.data.email) : null;
  if (email && !email.success) return { status: "error", message: "Please check the highlighted fields.", errors: { email: "That email address doesn't look right." } };

  const uploads = pickUploads(formData, "files", { max: MAX_ESTIMATE_FILES, pdf: true });
  if (!uploads.ok) return { status: "error", message: uploads.message, errors: { files: uploads.message } };

  if (await tooManyForms("estimate", 5)) return { status: "error", message: TOO_MANY_MESSAGE };

  try {
    const fileKeys: string[] = [];
    for (const file of uploads.files) fileKeys.push(await storeUpload(file));
    const inquiry = await prisma.inquiry.create({
      data: {
        type: "PROJECT_ESTIMATE",
        name: parsed.data.name,
        phone,
        email: email?.success ? email.data : null,
        message: parsed.data.description,
        fileKeys,
        meta: { projectType: parsed.data.projectType, timeline: parsed.data.timeline },
      },
    });
    after(() =>
      notifyStore({
        subject: `Project estimate request from ${parsed.data.name} (${parsed.data.projectType})`,
        fields: [
          ["Name", parsed.data.name],
          ["Phone", phone],
          ["Email", email?.success ? email.data : null],
          ["Project", parsed.data.projectType],
          ["Timeline", parsed.data.timeline],
          ["Files", fileKeys.length ? `${fileKeys.length} attached (see admin)` : null],
          ["Description", parsed.data.description],
        ],
        adminPath: `/admin/inquiries/${inquiry.id}`,
        replyTo: email?.success ? email.data : null,
      }),
    );
    return { status: "ok" };
  } catch (error) {
    console.error("[estimate] submit failed", error);
    return { status: "error", message: GENERIC_FORM_ERROR };
  }
}
