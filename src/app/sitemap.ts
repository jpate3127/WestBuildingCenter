import type { MetadataRoute } from "next";

import { prisma } from "@/lib/db";
import { getAllPromotions, getPublishedProjects } from "@/lib/queries";
import { siteUrl } from "@/lib/site";

const STATIC: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/promotions", priority: 0.9, changeFrequency: "weekly" },
  { path: "/projects", priority: 0.8, changeFrequency: "weekly" },
  { path: "/blinds", priority: 0.8, changeFrequency: "weekly" },
  { path: "/products", priority: 0.7, changeFrequency: "monthly" },
  { path: "/business", priority: 0.7, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/alerts", priority: 0.6, changeFrequency: "yearly" },
  { path: "/projects/estimate", priority: 0.6, changeFrequency: "yearly" },
  { path: "/projects/share", priority: 0.4, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/sms-terms", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [promotions, projects, items] = await Promise.all([
    getAllPromotions(),
    getPublishedProjects(),
    prisma.catalogItem.findMany({ where: { active: true }, select: { slug: true, category: true, updatedAt: true } }),
  ]).catch((error) => {
    // A sitemap with just the static pages beats a 500 when the database is unreachable.
    console.error("[sitemap] query failed", error);
    return [[], [], []] as const;
  });

  return [
    ...STATIC.map((s) => ({ url: siteUrl(s.path), priority: s.priority, changeFrequency: s.changeFrequency })),
    ...promotions.map((p) => ({ url: siteUrl(`/promotions/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...projects.map((p) => ({ url: siteUrl(`/projects/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...items.map((i) => ({ url: siteUrl(i.category === "BLIND" ? `/blinds/${i.slug}` : `/products/${i.slug}`), lastModified: i.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
