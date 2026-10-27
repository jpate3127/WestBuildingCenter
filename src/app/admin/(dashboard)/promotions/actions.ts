"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";

import { backWithError, checked, dateTimeInput, errorMessage, files, isDateInput, isTimeInput, optStr, startOfDayInput, str } from "@/components/admin/form";
import { requireAdminAction } from "@/lib/authz";
import { createBroadcast, runBroadcast } from "@/lib/broadcast";
import { prisma } from "@/lib/db";
import { endOfDayInput } from "@/lib/format";
import { isImageUpload, isPdfUpload, removeStored, storeImage, storePdf } from "@/lib/images";
import { uniqueSlug } from "@/lib/slug";

const schema = z.object({
  kind: z.enum(["PROMO", "EVENT"]),
  title: z.string().trim().min(2, "Give it a title.").max(120, "Keep the title under 120 characters."),
  brand: z.string().trim().max(60).nullable(),
  summary: z.string().trim().max(300, "Keep the summary under 300 characters.").nullable(),
  body: z.string().trim().max(8000).nullable(),
  startDate: z.string().trim(),
  endDate: z.string().trim(),
  startTime: z.string().trim(),
  endTime: z.string().trim(),
  published: z.boolean(),
});

function revalidatePromotion(...slugs: Array<string | null | undefined>) {
  revalidatePath("/");
  revalidatePath("/promotions");
  for (const slug of new Set(slugs.filter(Boolean) as string[])) revalidatePath(`/promotions/${slug}`);
}

/** Create (no id) or update a promotion from the form; uploads replace the stored files. */
export async function savePromotion(formData: FormData): Promise<void> {
  const admin = await requireAdminAction();
  const id = optStr(formData, "id");
  const formPath = id ? `/admin/promotions/${id}` : "/admin/promotions/new";

  const parsed = schema.safeParse({
    kind: str(formData, "kind"),
    title: str(formData, "title"),
    brand: optStr(formData, "brand"),
    summary: optStr(formData, "summary"),
    body: optStr(formData, "body"),
    startDate: str(formData, "startDate"),
    endDate: str(formData, "endDate"),
    startTime: str(formData, "startTime"),
    endTime: str(formData, "endTime"),
    published: checked(formData, "published"),
  });
  if (!parsed.success) backWithError(formPath, parsed.error.issues[0]?.message ?? "Check the form.");
  const data = parsed.data;

  // Dates: a promo runs whole days; an event is one day with a start and end time.
  let startsAt: Date | null = null;
  let endsAt: Date | null = null;
  if (data.kind === "EVENT") {
    if (!isDateInput(data.startDate)) backWithError(formPath, "An event needs a date.");
    startsAt = isTimeInput(data.startTime) ? dateTimeInput(data.startDate, data.startTime) : startOfDayInput(data.startDate);
    endsAt = isTimeInput(data.endTime) ? dateTimeInput(data.startDate, data.endTime) : endOfDayInput(data.startDate);
    if (endsAt < startsAt) backWithError(formPath, "The event's end time is before its start time.");
  } else {
    if (data.startDate && !isDateInput(data.startDate)) backWithError(formPath, "The start date doesn't look right.");
    if (data.endDate && !isDateInput(data.endDate)) backWithError(formPath, "The end date doesn't look right.");
    startsAt = data.startDate ? startOfDayInput(data.startDate) : null;
    endsAt = data.endDate ? endOfDayInput(data.endDate) : null;
    if (startsAt && endsAt && endsAt < startsAt) backWithError(formPath, "The end date is before the start date.");
  }

  const existing = id ? await prisma.promotion.findUnique({ where: { id }, include: { _count: { select: { broadcasts: true } } } }) : null;
  if (id && !existing) backWithError("/admin/promotions", "That promotion no longer exists.");

  const image = files(formData, "image")[0];
  const pdf = files(formData, "pdf")[0];
  if (image && !isImageUpload(image)) backWithError(formPath, "The cover must be an image (JPG, PNG, HEIC).");
  if (pdf && !isPdfUpload(pdf)) backWithError(formPath, "The flyer must be a PDF.");

  // Store new files first so a failed upload leaves the row untouched.
  let imageKey = existing?.imageKey ?? null;
  let pdfKey = existing?.pdfKey ?? null;
  const toRemove: string[] = [];
  try {
    if (image) {
      if (imageKey) toRemove.push(imageKey);
      imageKey = await storeImage(image);
    } else if (checked(formData, "removeImage") && imageKey) {
      toRemove.push(imageKey);
      imageKey = null;
    }
    if (pdf) {
      if (pdfKey) toRemove.push(pdfKey);
      pdfKey = await storePdf(pdf);
    } else if (checked(formData, "removePdf") && pdfKey) {
      toRemove.push(pdfKey);
      pdfKey = null;
    }
  } catch (error) {
    backWithError(formPath, `Upload failed: ${errorMessage(error)}`);
  }

  // The slug is in every text we have sent; keep it once an alert has gone out.
  const keepSlug = existing && existing._count.broadcasts > 0;
  const slug = keepSlug
    ? existing.slug
    : await uniqueSlug(data.title, async (candidate) => {
        const row = await prisma.promotion.findUnique({ where: { slug: candidate }, select: { id: true } });
        return Boolean(row) && row?.id !== id;
      });

  const publishedAt = data.published ? (existing?.publishedAt ?? new Date()) : null;
  const values = { kind: data.kind, slug, title: data.title, brand: data.brand, summary: data.summary, body: data.body, startsAt, endsAt, publishedAt, imageKey, pdfKey };

  const saved = existing ? await prisma.promotion.update({ where: { id: existing.id }, data: values }) : await prisma.promotion.create({ data: values });
  await Promise.all(toRemove.map((key) => removeStored(key).catch((error) => console.warn(`[admin] could not remove ${key}`, error))));

  console.info(`[admin] ${admin.email} saved promotion ${saved.id} (${saved.slug})`);
  revalidatePromotion(existing?.slug, saved.slug);
  redirect(`/admin/promotions/${saved.id}?saved=1`);
}

export async function deletePromotion(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = str(formData, "id");
  const row = await prisma.promotion.findUnique({ where: { id } });
  if (!row) redirect("/admin/promotions");
  await prisma.promotion.delete({ where: { id } });
  await Promise.all([row.imageKey, row.pdfKey].filter(Boolean).map((key) => removeStored(key!).catch(() => undefined)));
  revalidatePromotion(row.slug);
  redirect(`/admin/promotions?ok=${encodeURIComponent(`Deleted "${row.title}".`)}`);
}

const alertSchema = z.object({
  promotionId: z.string().min(1),
  sendSms: z.boolean(),
  sendEmail: z.boolean(),
  smsText: z.string().trim().max(320).nullable(),
  emailSubject: z.string().trim().max(120).nullable(),
});

/** "Send alert": record the Broadcast now, send after the response goes out. */
export async function sendAlert(formData: FormData): Promise<void> {
  const admin = await requireAdminAction();
  const parsed = alertSchema.safeParse({
    promotionId: str(formData, "promotionId"),
    sendSms: checked(formData, "sendSms"),
    sendEmail: checked(formData, "sendEmail"),
    smsText: optStr(formData, "smsText"),
    emailSubject: optStr(formData, "emailSubject"),
  });
  if (!parsed.success) backWithError("/admin/promotions", "Check the alert form.");
  const { promotionId, sendSms, sendEmail, smsText, emailSubject } = parsed.data;
  const path = `/admin/promotions/${promotionId}`;

  const promotion = await prisma.promotion.findUnique({ where: { id: promotionId }, select: { publishedAt: true } });
  if (!promotion) backWithError("/admin/promotions", "That promotion no longer exists.");
  if (!promotion.publishedAt) backWithError(path, "Publish the promotion before sending an alert.");
  if (!sendSms && !sendEmail) backWithError(path, "Pick texts, emails or both.");
  if (sendSms && !smsText) backWithError(path, "The text message is empty.");
  if (sendEmail && !emailSubject) backWithError(path, "The email needs a subject.");

  const id = await createBroadcast({ promotionId, sentBy: admin.email, smsText: sendSms ? smsText : null, emailSubject: sendEmail ? emailSubject : null });
  after(() => runBroadcast(id).catch((error) => console.error(`[broadcast] ${id} failed`, error)));
  redirect(`${path}?sent=1`);
}
