"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { backWithError, backWithOk, str } from "@/components/admin/form";
import { requireAdminAction } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { removeStored } from "@/lib/images";

const STATUSES = ["NEW", "REPLIED", "CLOSED"] as const;

export async function setInquiryStatus(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = str(formData, "id");
  const parsed = z.enum(STATUSES).safeParse(str(formData, "status"));
  if (!parsed.success) backWithError(`/admin/inquiries/${id}`, "Unknown status.");
  await prisma.inquiry.updateMany({ where: { id }, data: { status: parsed.data } });
  redirect(`/admin/inquiries/${id}`);
}

export async function saveInquiryNotes(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = str(formData, "id");
  const parsed = z.string().trim().max(4000).safeParse(str(formData, "notes"));
  if (!parsed.success) backWithError(`/admin/inquiries/${id}`, "Keep the notes under 4000 characters.");
  await prisma.inquiry.updateMany({ where: { id }, data: { notes: parsed.data || null } });
  backWithOk(`/admin/inquiries/${id}`, "Notes saved.");
}

export async function deleteInquiry(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = str(formData, "id");
  const row = await prisma.inquiry.findUnique({ where: { id }, select: { fileKeys: true, name: true } });
  if (!row) redirect("/admin/inquiries");
  await prisma.inquiry.delete({ where: { id } });
  await Promise.all(row.fileKeys.map((key) => removeStored(key).catch(() => undefined)));
  backWithOk("/admin/inquiries", `Deleted the message from ${row.name}.`);
}
