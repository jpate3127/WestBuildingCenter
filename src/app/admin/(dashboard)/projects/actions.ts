"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { backWithError, checked, errorMessage, files, optStr, str } from "@/components/admin/form";
import { requireAdminAction } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { isImageUpload, removeStored, storeImage } from "@/lib/images";
import { PROJECT_TAGS } from "@/lib/labels";
import { uniqueSlug } from "@/lib/slug";

const STATUSES = ["SUBMITTED", "PUBLISHED", "HIDDEN"] as const;

const schema = z.object({
  title: z.string().trim().min(2, "Give the project a title.").max(120, "Keep the title under 120 characters."),
  tags: z.array(z.enum(PROJECT_TAGS)).max(PROJECT_TAGS.length),
  caption: z.string().trim().max(300, "Keep the caption under 300 characters.").nullable(),
  materials: z.string().trim().max(300).nullable(),
  body: z.string().trim().max(8000).nullable(),
  location: z.string().trim().max(80).nullable(),
  featured: z.boolean(),
  sortOrder: z.coerce.number().int().min(-1000).max(100000),
  status: z.enum(STATUSES),
});

function revalidateProjects(...slugs: Array<string | null | undefined>) {
  revalidatePath("/");
  revalidatePath("/projects");
  for (const slug of new Set(slugs.filter(Boolean) as string[])) revalidatePath(`/projects/${slug}`);
}

export async function saveProject(formData: FormData): Promise<void> {
  const admin = await requireAdminAction();
  const id = optStr(formData, "id");
  const formPath = id ? `/admin/projects/${id}` : "/admin/projects/new";

  const parsed = schema.safeParse({
    title: str(formData, "title"),
    tags: formData.getAll("tags").filter((v) => typeof v === "string"),
    caption: optStr(formData, "caption"),
    materials: optStr(formData, "materials"),
    body: optStr(formData, "body"),
    location: optStr(formData, "location"),
    featured: checked(formData, "featured"),
    sortOrder: str(formData, "sortOrder") || "0",
    status: str(formData, "status"),
  });
  if (!parsed.success) backWithError(formPath, parsed.error.issues[0]?.message ?? "Check the form.");
  const data = parsed.data;

  const existing = id ? await prisma.project.findUnique({ where: { id } }) : null;
  if (id && !existing) backWithError("/admin/projects", "That project no longer exists.");

  const removed = new Set(formData.getAll("removeImage").filter((v): v is string => typeof v === "string"));
  let imageKeys = (existing?.imageKeys ?? []).filter((key) => !removed.has(key));
  const first = str(formData, "firstImage");
  if (first && imageKeys.includes(first)) imageKeys = [first, ...imageKeys.filter((key) => key !== first)];

  const uploads = files(formData, "images");
  if (uploads.some((file) => !isImageUpload(file))) backWithError(formPath, "Photos only here (JPG, PNG, HEIC).");
  const added: string[] = [];
  try {
    for (const file of uploads) added.push(await storeImage(file));
  } catch (error) {
    await Promise.all(added.map((key) => removeStored(key).catch(() => undefined)));
    backWithError(formPath, `Upload failed: ${errorMessage(error)}`);
  }
  imageKeys = [...imageKeys, ...added];
  if (data.status === "PUBLISHED" && imageKeys.length === 0) backWithError(formPath, "Add at least one photo before publishing.");

  const slug =
    existing && existing.title === data.title
      ? existing.slug
      : await uniqueSlug(data.title, async (candidate) => {
          const row = await prisma.project.findUnique({ where: { slug: candidate }, select: { id: true } });
          return Boolean(row) && row?.id !== id;
        });

  const values = {
    slug,
    title: data.title,
    tags: data.tags,
    caption: data.caption,
    materials: data.materials,
    body: data.body,
    location: data.location,
    featured: data.featured,
    sortOrder: data.sortOrder,
    status: data.status,
    imageKeys,
  };
  const saved = existing ? await prisma.project.update({ where: { id: existing.id }, data: values }) : await prisma.project.create({ data: values });
  await Promise.all((existing?.imageKeys ?? []).filter((key) => removed.has(key)).map((key) => removeStored(key).catch(() => undefined)));

  console.info(`[admin] ${admin.email} saved project ${saved.id} (${saved.slug})`);
  revalidateProjects(existing?.slug, saved.slug);
  redirect(`/admin/projects/${saved.id}?saved=1`);
}

/** The Publish / Hide buttons on list rows. */
export async function setProjectStatus(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = str(formData, "id");
  const status = str(formData, "status");
  const back = str(formData, "back") || "/admin/projects";
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) backWithError(back, "Unknown status.");
  const row = await prisma.project.findUnique({ where: { id }, select: { slug: true, imageKeys: true, title: true } });
  if (!row) backWithError(back, "That project no longer exists.");
  if (status === "PUBLISHED" && row.imageKeys.length === 0) backWithError(back, `"${row.title}" has no photo yet; open it and add one before publishing.`);
  await prisma.project.update({ where: { id }, data: { status: status as (typeof STATUSES)[number] } });
  revalidateProjects(row.slug);
  redirect(back);
}

export async function deleteProject(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = str(formData, "id");
  const row = await prisma.project.findUnique({ where: { id } });
  if (!row) redirect("/admin/projects");
  await prisma.project.delete({ where: { id } });
  await Promise.all(row.imageKeys.map((key) => removeStored(key).catch(() => undefined)));
  revalidateProjects(row.slug);
  redirect(`/admin/projects?ok=${encodeURIComponent(`Deleted "${row.title}".`)}`);
}
