import { prisma } from "@/lib/db";
import { isActive } from "@/lib/format";

/**
 * Read-side queries shared by the public pages. Everything the owner sees
 * in the admin comes straight from Prisma; these add the "what is live right
 * now" rules so pages never repeat them.
 */

const publishedPromotion = (now: Date) => ({
  publishedAt: { not: null, lte: now },
  OR: [{ endsAt: null }, { endsAt: { gte: now } }],
});

/** The newest live flyer (PROMO) and the next live event, for the homepage. */
export async function getLivePromotions(now = new Date()) {
  const [promos, events] = await Promise.all([
    prisma.promotion.findMany({
      where: { kind: "PROMO", ...publishedPromotion(now) },
      orderBy: [{ startsAt: "desc" }, { publishedAt: "desc" }],
    }),
    prisma.promotion.findMany({
      where: { kind: "EVENT", ...publishedPromotion(now) },
      orderBy: [{ startsAt: "asc" }],
    }),
  ]);
  const live = (list: typeof promos) => list.filter((p) => isActive(now, p.startsAt, null) || !p.startsAt);
  // A flyer whose start date is still ahead stays hidden; an event shows as soon as it is published.
  return { featured: live(promos)[0] ?? null, promos: live(promos), nextEvent: events[0] ?? null, events };
}

export async function getPromotionBySlug(slug: string) {
  return prisma.promotion.findFirst({ where: { slug, publishedAt: { not: null } }, include: { catalogItems: { where: { active: true }, orderBy: { sortOrder: "asc" } } } });
}

/** Everything published, newest first, for the Past promotions list. */
export async function getAllPromotions() {
  return prisma.promotion.findMany({ where: { publishedAt: { not: null } }, orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }] });
}

export async function getFeaturedPicks(limit = 6) {
  return prisma.catalogItem.findMany({
    where: { featured: true, active: true },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    take: limit,
    include: { promotion: { select: { slug: true, pdfKey: true } } },
  });
}

export async function getCatalogByCategory(category: "BLIND" | "TOOL" | "OUTDOOR" | "DECKING" | "KITCHEN" | "LUMBER" | "OTHER") {
  return prisma.catalogItem.findMany({
    where: { category, active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { promotion: { select: { slug: true, pdfKey: true } } },
  });
}

export async function getCatalogItemBySlug(slug: string) {
  return prisma.catalogItem.findFirst({ where: { slug, active: true }, include: { promotion: { select: { slug: true, pdfKey: true, title: true } } } });
}

export async function getPublishedProjects(options: { tag?: string | null; limit?: number } = {}) {
  const tag = options.tag && options.tag !== "ALL" ? (options.tag as never) : undefined;
  return prisma.project.findMany({
    where: { status: "PUBLISHED", ...(tag ? { tags: { has: tag } } : {}) },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    take: options.limit,
  });
}

export async function getFeaturedProject() {
  return prisma.project.findFirst({ where: { status: "PUBLISHED", featured: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
}

export async function getProjectBySlug(slug: string) {
  return prisma.project.findFirst({ where: { slug, status: "PUBLISHED" } });
}
