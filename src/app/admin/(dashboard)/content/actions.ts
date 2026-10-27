"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { backWithError, backWithOk } from "@/components/admin/form";
import { requireAdminAction } from "@/lib/authz";
import { CONTENT_DEFAULTS, CONTENT_KEYS } from "@/lib/content";
import { prisma } from "@/lib/db";

const value = z.string().max(8000, "One of the fields is longer than 8000 characters.");

/** Save every content block at once: a row only where the text differs from the default. */
export async function saveContent(formData: FormData): Promise<void> {
  const admin = await requireAdminAction();
  const writes = [];
  for (const key of CONTENT_KEYS) {
    const raw = formData.get(`v:${key}`);
    const reset = formData.get(`reset:${key}`) === "on";
    const parsed = value.safeParse(typeof raw === "string" ? raw.replace(/\r\n/g, "\n").trim() : "");
    if (!parsed.success) backWithError("/admin/content", parsed.error.issues[0]?.message ?? "Check the form.");
    const text = parsed.data;
    if (reset || text === CONTENT_DEFAULTS[key].default) {
      writes.push(prisma.contentBlock.deleteMany({ where: { key } }));
    } else {
      writes.push(prisma.contentBlock.upsert({ where: { key }, create: { key, value: text, updatedBy: admin.email }, update: { value: text, updatedBy: admin.email } }));
    }
  }
  await prisma.$transaction(writes);
  revalidatePath("/", "layout");
  backWithOk("/admin/content", "Content saved. The site shows it now.");
}
