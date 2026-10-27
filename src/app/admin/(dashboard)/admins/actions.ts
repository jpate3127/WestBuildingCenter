"use server";

import { z } from "zod";

import { backWithError, backWithOk, optStr, str } from "@/components/admin/form";
import { envAdminEmails } from "@/lib/auth";
import { requireAdminAction } from "@/lib/authz";
import { prisma } from "@/lib/db";

const PATH = "/admin/admins";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("That email address doesn't look right.").max(120),
  name: z.string().trim().max(80).nullable(),
});

export async function addAdmin(formData: FormData): Promise<void> {
  const admin = await requireAdminAction();
  const parsed = schema.safeParse({ email: str(formData, "email"), name: optStr(formData, "name") });
  if (!parsed.success) backWithError(PATH, parsed.error.issues[0]?.message ?? "Check the form.");
  const { email, name } = parsed.data;
  if (envAdminEmails().includes(email)) backWithOk(PATH, `${email} is already an admin through the server settings.`);
  await prisma.admin.upsert({ where: { email }, create: { email, name, addedBy: admin.email }, update: { name: name ?? undefined } });
  backWithOk(PATH, `${email} can sign in now with that Google account.`);
}

export async function removeAdmin(formData: FormData): Promise<void> {
  const admin = await requireAdminAction();
  const id = str(formData, "id");
  const row = await prisma.admin.findUnique({ where: { id } });
  if (!row) backWithError(PATH, "That admin was already removed.");
  if (row.email === admin.email) backWithError(PATH, "You can't remove yourself. Ask another admin to do it.");
  await prisma.admin.delete({ where: { id } });
  // Their open sessions end on the next request: authz checks the allowlist every time.
  backWithOk(PATH, `${row.email} can no longer sign in.`);
}
