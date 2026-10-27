"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { backWithError, checked, errorMessage, files, optStr, parseDollars, str } from "@/components/admin/form";
import { requireAdminAction } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { isImageUpload, removeStored, storeImage } from "@/lib/images";
import { CATALOG_CATEGORIES } from "@/lib/labels";
import { uniqueSlug } from "@/lib/slug";

const schema = z.object({
  name: z.string().trim().min(2, "Give it a name.").max(120, "Keep the name under 120 characters."),
  category: z.enum(CATALOG_CATEGORIES),
  brand: z.string().trim().max(60).nullable(),
  description: z.string().trim().max(4000).nullable(),
  priceNote: z.string().trim().max(60).nullable(),
  stockNote: z.string().trim().max(60).nullable(),
  badge: z.string().trim().max(24, "Keep the badge short (24 characters).").nullable(),
  featured: z.boolean(),
  active: z.boolean(),
  sortOrder: z.coerce.number().int().min(-1000).max(100000),
  promotionId: z.string().trim().nullable(),
});

function revalidateCatalog(promotionSlugs: Array<string | null | undefined>, ...slugs: Array<string | null | undefined>) {
  revalidatePath("/");
  revalidatePath("/blinds");
  revalidatePath("/products");
  for (const slug of new Set(slugs.filter(Boolean) as string[])) {
    revalidatePath(`/products/${slug}`);
    revalidatePath(`/blinds/${slug}`);
  }
  for (const slug of new Set(promotionSlugs.filter(Boolean) as string[])) revalidatePath(`/promotions/${slug}`);
}

/** Create (no id) or update a catalog item; new photos append, checked ones go away. */
export async function saveCatalogItem(formData: FormData): Promise<void> {
  const admin = await requireAdminAction();
  const id = optStr(formData, "id");
  const formPath = id ? `/admin/catalog/${id}` : "/admin/catalog/new";

  const parsed = schema.safeParse({
    name: str(formData, "name"),
    category: str(formData, "category"),
    brand: optStr(formData, "brand"),
    description: optStr(formData, "description"),
    priceNote: optStr(formData, "priceNote"),
    stockNote: optStr(formData, "stockNote"),
    badge: optStr(formData, "badge"),
    featured: checked(formData, "featured"),
    active: checked(formData, "active"),
    sortOrder: str(formData, "sortOrder") || "0",
    promotionId: optStr(formData, "promotionId"),
  });
  if (!parsed.success) backWithError(formPath, parsed.error.issues[0]?.message ?? "Check the form.");
  const data = parsed.data;

  const priceCents = parseDollars(str(formData, "price"));
  if (Number.isNaN(priceCents)) backWithError(formPath, "The price should be a number, like 389 or 1,750.00.");
  if (priceCents !== null && priceCents < 0) backWithError(formPath, "The price can't be negative.");

  const existing = id ? await prisma.catalogItem.findUnique({ where: { id }, include: { promotion: { select: { slug: true } } } }) : null;
  if (id && !existing) backWithError("/admin/catalog", "That item no longer exists.");

  let promotionId: string | null = null;
  let promotionSlug: string | null = null;
  if (data.promotionId) {
    const promotion = await prisma.promotion.findUnique({ where: { id: data.promotionId }, select: { id: true, slug: true } });
    if (!promotion) backWithError(formPath, "That promotion no longer exists.");
    promotionId = promotion.id;
    promotionSlug = promotion.slug;
  }

  // Photos: keep the ones not checked for removal, move the chosen one first, append uploads.
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

  const slug =
    existing && existing.name === data.name
      ? existing.slug
      : await uniqueSlug(data.name, async (candidate) => {
          const row = await prisma.catalogItem.findUnique({ where: { slug: candidate }, select: { id: true } });
          return Boolean(row) && row?.id !== id;
        });

  const values = {
    slug,
    name: data.name,
    category: data.category,
    brand: data.brand,
    description: data.description,
    priceCents,
    priceNote: data.priceNote,
    stockNote: data.stockNote,
    badge: data.badge,
    featured: data.featured,
    active: data.active,
    sortOrder: data.sortOrder,
    promotionId,
    imageKeys,
  };
  const saved = existing ? await prisma.catalogItem.update({ where: { id: existing.id }, data: values }) : await prisma.catalogItem.create({ data: values });
  await Promise.all((existing?.imageKeys ?? []).filter((key) => removed.has(key)).map((key) => removeStored(key).catch(() => undefined)));

  console.info(`[admin] ${admin.email} saved catalog item ${saved.id} (${saved.slug})`);
  revalidateCatalog([existing?.promotion?.slug, promotionSlug], existing?.slug, saved.slug);
  redirect(`/admin/catalog/${saved.id}?saved=1`);
}

export async function deleteCatalogItem(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = str(formData, "id");
  const row = await prisma.catalogItem.findUnique({ where: { id }, include: { promotion: { select: { slug: true } } } });
  if (!row) redirect("/admin/catalog");
  await prisma.catalogItem.delete({ where: { id } });
  await Promise.all(row.imageKeys.map((key) => removeStored(key).catch(() => undefined)));
  revalidateCatalog([row.promotion?.slug], row.slug);
  redirect(`/admin/catalog?ok=${encodeURIComponent(`Deleted "${row.name}".`)}`);
}

/** Up/down on the Top deals page: renumber the featured list so the move sticks. */
export async function moveFeatured(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = str(formData, "id");
  const direction = str(formData, "direction") === "up" ? -1 : 1;
  const items = await prisma.catalogItem.findMany({ where: { featured: true }, orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }], select: { id: true } });
  const index = items.findIndex((item) => item.id === id);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= items.length) redirect("/admin/catalog/featured");
  const order = items.map((item) => item.id);
  [order[index], order[target]] = [order[target], order[index]];
  await prisma.$transaction(order.map((itemId, position) => prisma.catalogItem.update({ where: { id: itemId }, data: { sortOrder: position } })));
  revalidatePath("/");
  redirect("/admin/catalog/featured");
}

export async function unfeature(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = str(formData, "id");
  await prisma.catalogItem.updateMany({ where: { id }, data: { featured: false } });
  revalidatePath("/");
  redirect("/admin/catalog/featured");
}
