"use server";

import { z } from "zod";

import { TOO_MANY_MESSAGE, fieldErrors, isBot, pickUploads, tooManyForms } from "@/app/(site)/formUtils";
import { MAX_SHARE_PHOTOS } from "@/app/(site)/projects/share/constants";
import { GENERIC_FORM_ERROR, type FormState } from "@/components/site/formState";
import type { ProjectTag } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { storeImage } from "@/lib/images";
import { PROJECT_TAGS } from "@/lib/labels";
import { notifyStore } from "@/lib/notify";
import { uniqueSlug } from "@/lib/slug";
import { after } from "next/server";

const schema = z.object({
  name: z.string().trim().min(2, "Please tell us your name.").max(80),
  contact: z.string().trim().min(5, "A phone number or email so we can say thanks.").max(120),
  title: z.string().trim().min(3, "Give the project a name, like “Shop on Route K”.").max(100),
  caption: z.string().trim().max(1000).optional(),
});

export async function shareProject(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { status: "ok" };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    contact: formData.get("contact"),
    title: formData.get("title"),
    caption: formData.get("caption") || undefined,
  });
  if (!parsed.success) return { status: "error", message: "Please check the highlighted fields.", errors: fieldErrors(parsed.error) };

  const tags = formData.getAll("tags").filter((t): t is ProjectTag => typeof t === "string" && (PROJECT_TAGS as string[]).includes(t));

  const uploads = pickUploads(formData, "photos", { max: MAX_SHARE_PHOTOS });
  if (!uploads.ok) return { status: "error", message: uploads.message, errors: { photos: uploads.message } };
  if (uploads.files.length === 0) return { status: "error", message: "Please add at least one photo.", errors: { photos: "Add at least one photo of the finished job." } };

  if (await tooManyForms("share", 4)) return { status: "error", message: TOO_MANY_MESSAGE };

  try {
    const imageKeys: string[] = [];
    for (const file of uploads.files) imageKeys.push(await storeImage(file));
    const slug = await uniqueSlug(parsed.data.title, async (s) => Boolean(await prisma.project.findUnique({ where: { slug: s }, select: { id: true } })));
    const project = await prisma.project.create({
      data: {
        slug,
        title: parsed.data.title,
        tags,
        caption: parsed.data.caption ?? null,
        imageKeys,
        status: "SUBMITTED",
        submittedName: parsed.data.name,
        submittedContact: parsed.data.contact,
      },
    });
    after(() =>
      notifyStore({
        subject: `Customer project photos from ${parsed.data.name}: ${parsed.data.title}`,
        fields: [["Name", parsed.data.name], ["Contact", parsed.data.contact], ["Project", parsed.data.title], ["Photos", `${imageKeys.length} (review and publish in admin)`], ["Note", parsed.data.caption]],
        adminPath: `/admin/projects/${project.id}`,
      }),
    );
    return { status: "ok" };
  } catch (error) {
    console.error("[share] submit failed", error);
    return { status: "error", message: GENERIC_FORM_ERROR };
  }
}
