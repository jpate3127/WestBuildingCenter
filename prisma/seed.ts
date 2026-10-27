import "dotenv/config";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { CatalogCategory, ProjectTag } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/db";
import { storeImage } from "../src/lib/images";

/**
 * Starter content so the site is never empty: WBC's current Milwaukee flyer,
 * six picks, the three blinds, six local projects and a draft Milwaukee Days
 * event. Photos come from WBC's own Facebook posts (prisma/seed-assets).
 *
 * Safe to run again: rows are matched by slug and only created when missing,
 * so the owners' edits are never overwritten. `npm run db:seed`.
 */

const ASSETS = join(process.cwd(), "prisma", "seed-assets");

async function image(file: string): Promise<string> {
  return storeImage(await readFile(join(ASSETS, file)));
}

async function ensurePromotion(data: {
  slug: string;
  kind: "PROMO" | "EVENT";
  title: string;
  brand?: string;
  summary?: string;
  body?: string;
  image?: string;
  startsAt?: Date;
  endsAt?: Date;
  published: boolean;
}) {
  const existing = await prisma.promotion.findUnique({ where: { slug: data.slug } });
  if (existing) return existing;
  const imageKey = data.image ? await image(data.image) : null;
  return prisma.promotion.create({
    data: {
      slug: data.slug,
      kind: data.kind,
      title: data.title,
      brand: data.brand,
      summary: data.summary,
      body: data.body,
      imageKey,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      publishedAt: data.published ? new Date() : null,
    },
  });
}

async function ensureCatalogItem(data: {
  slug: string;
  name: string;
  category: CatalogCategory;
  brand?: string;
  description?: string;
  priceCents?: number;
  priceNote?: string;
  stockNote?: string;
  badge?: string;
  images: string[];
  featured?: boolean;
  sortOrder: number;
  promotionId?: string;
}) {
  const existing = await prisma.catalogItem.findUnique({ where: { slug: data.slug } });
  if (existing) return existing;
  const imageKeys: string[] = [];
  for (const file of data.images) imageKeys.push(await image(file));
  const { images, ...rest } = data;
  void images;
  return prisma.catalogItem.create({ data: { ...rest, imageKeys, featured: data.featured ?? false } });
}

async function ensureProject(data: {
  slug: string;
  title: string;
  tags: ProjectTag[];
  caption?: string;
  materials?: string;
  body?: string;
  images: string[];
  featured?: boolean;
  sortOrder: number;
  location?: string;
}) {
  const existing = await prisma.project.findUnique({ where: { slug: data.slug } });
  if (existing) return existing;
  const imageKeys: string[] = [];
  for (const file of data.images) imageKeys.push(await image(file));
  const { images, ...rest } = data;
  void images;
  return prisma.project.create({ data: { ...rest, imageKeys, status: "PUBLISHED", featured: data.featured ?? false } });
}

async function main() {
  const forge = await ensurePromotion({
    slug: "m18-forge-battery-free",
    kind: "PROMO",
    title: "Buy an M18 tool, get a FORGE XC8.0 battery free",
    brand: "Milwaukee",
    summary: "A $229 battery free with qualifying M18 tools. Plus M18 special buys and free-tool offers inside the flyer.",
    body: "Buy any qualifying M18 tool and get an M18 REDLITHIUM FORGE XC8.0 battery (a $229 value) free. In-store through January 31, 2027, while supplies last.\n\nWe stock more promos than what's on the flyer. Call and we'll hold one for you.",
    image: "flyer-m18-forge.png",
    // The flyer's buy-in window opens Oct 1; in-store execution runs Nov 2 – Jan 31.
    startsAt: new Date("2026-10-01T00:00:00-05:00"),
    endsAt: new Date("2027-01-31T23:59:59-06:00"),
    published: true,
  });

  await ensurePromotion({
    slug: "milwaukee-days",
    kind: "EVENT",
    title: "Milwaukee Days",
    brand: "Milwaukee",
    summary: "Extra promos beyond the flyer, giveaways with Milwaukee purchases, and lunch on us.",
    body: "Our Milwaukee rep is in the store with deals that aren't on the flyer. Every Milwaukee purchase enters you to win. Free hamburger and hot dog lunch while it lasts.\n\nSet the date and time in the admin, then publish and send the alert.",
    published: false,
  });

  const picks: Parameters<typeof ensureCatalogItem>[0][] = [
    { slug: "m18-fuel-16-chainsaw-kit", name: 'M18 FUEL 16" chainsaw kit', category: "TOOL", brand: "Milwaukee", description: "12.0 FORGE battery and charger included.", priceCents: 39900, stockNote: "Limited stock", badge: "$100 OFF", images: ["deal-chainsaw.png"], featured: true, sortOrder: 1, promotionId: forge.id },
    { slug: "m18-fuel-string-trimmer-kit", name: "M18 FUEL string trimmer kit", category: "TOOL", brand: "Milwaukee", description: "Get a Quik-Lok edger, brush cutter or pole saw attachment free.", priceCents: 37900, badge: "FREE ATTACHMENT", images: ["deal-trimmer-crop.png"], featured: true, sortOrder: 2 },
    { slug: "m18-backpack-sprayer", name: "M18 4-gallon backpack sprayer", category: "TOOL", brand: "Milwaukee", description: "Tool only. Fresh shipment on the shelf.", priceCents: 38900, stockNote: "Back in stock", badge: "BACK IN STOCK", images: ["deal-sprayer.png"], featured: true, sortOrder: 3 },
    { slug: "m18-fuel-2-tool-combo-kit", name: "M18 FUEL 2-tool combo kit", category: "TOOL", brand: "Milwaukee", description: "Or a battery 2-pack from $199. Pick a free tool worth up to $249.", priceCents: 39900, badge: "+ FREE TOOL", images: ["flyer-m18-combo.png"], featured: true, sortOrder: 4, promotionId: forge.id },
    { slug: "m12-xc5-battery-2-pack", name: "Two M12 XC5.0 batteries", category: "TOOL", brand: "Milwaukee", description: "Pick a free M12 tool worth up to $229.", priceCents: 19999, badge: "+ FREE TOOL", images: ["deal-m12-buy2-crop.png"], featured: true, sortOrder: 5 },
    { slug: "m12-new-lower-prices", name: "M12 new lower prices", category: "TOOL", brand: "Milwaukee", description: "Inflator, cable stapler, nailers, chargers.", priceCents: 7999, priceNote: "and up", badge: "UP TO $50 OFF", images: ["deal-m12-lower.png"], featured: true, sortOrder: 6 },
    { slug: "hawk-office-blind", name: "Hawk Office", category: "BLIND", brand: "Hawk", description: "With 5 ft or 10 ft tower.\nFull-size box blind with tinted windows, sealed floor and a lockable door. We install.", priceCents: 395000, stockNote: "In stock", images: ["blind-hawk.png", "blinds-lot.png"], sortOrder: 1 },
    { slug: "muddy-bull-blind", name: "Muddy Bull", category: "BLIND", brand: "Muddy", description: "With 5 ft or 10 ft tower.\nRoomy box blind with cracked-mud camo and silent-slide windows. We install.", priceCents: 327500, stockNote: "In stock", images: ["blind-muddy-tower.png", "blinds-lot.png"], sortOrder: 2 },
    { slug: "muddy-gunner-blind", name: "Muddy Gunner", category: "BLIND", brand: "Muddy", description: "With 5 ft tower.\nCompact box blind for one or two hunters. We install.", priceCents: 175000, stockNote: "In stock", images: ["blinds-lot.png"], sortOrder: 3 },
    { slug: "tactacam-defend-360", name: "Tactacam Defend 360 cellular camera", category: "OUTDOOR", brand: "Tactacam", description: "No Wi-Fi needed. Watches your property or your stand over the cellular network through the Defend app.", priceCents: 19900, images: [], sortOrder: 10 },
  ];
  for (const pick of picks) await ensureCatalogItem(pick);

  const projects: Parameters<typeof ensureProject>[0][] = [
    { slug: "new-farmhouse", title: "New farmhouse with a wraparound porch", tags: ["NEW_HOME", "SIDING"], caption: "Board-and-batten siding, black windows and a porch that runs the whole front.", materials: "Framing package, siding, windows, roofing", images: ["proj-farmhouse.png"], featured: true, sortOrder: 1, location: "near Atlanta, MO" },
    { slug: "dark-siding-covered-porch", title: "Dark siding and a covered porch", tags: ["SIDING"], caption: "Two-story with dormers and a long covered porch.", materials: "LP SmartSide siding, trim", images: ["proj-siding-dark.png"], sortOrder: 2 },
    { slug: "custom-kitchen-wolf-cabinets", title: "Custom kitchen with Wolf cabinets and quartz", tags: ["KITCHEN"], caption: "Wolf Classic cabinets in Grove Opal with an Artisan oak island and quartz countertops.", materials: "Wolf cabinetry, quartz countertops", images: ["proj-kitchen.png"], sortOrder: 3 },
    { slug: "new-shop-gravel-drive", title: "New shop with a gravel drive", tags: ["SHOP_BARN"], caption: "Steel-sided shop with two overhead doors and a fresh driveway.", materials: "Steel siding and roofing, overhead doors, gravel", images: ["proj-shop.png"], sortOrder: 4 },
    { slug: "low-maintenance-siding-farmhouse", title: "Low-maintenance siding, wraparound porch", tags: ["SIDING", "NEW_HOME"], caption: "Light siding with dormers, a split-rail fence and a porch on three sides.", materials: "Siding, windows, porch posts", images: ["proj-siding-white.png"], sortOrder: 5 },
    { slug: "roman-stone-outdoor-fireplace", title: "Roman Stone outdoor fireplace", tags: ["OUTDOOR"], caption: "A Freemont outdoor fireplace going up on a new patio, one block at a time.", materials: "Roman Stone Freemont fireplace kit", images: ["proj-fireplace.png"], sortOrder: 6 },
    { slug: "lp-smartside-package", title: "LP SmartSide package heading to a new home", tags: ["NEW_HOME", "SIDING"], caption: "A full siding package loaded and on its way to the job site.", materials: "LP SmartSide siding", images: ["proj-lp-delivery.png"], sortOrder: 7 },
  ];
  for (const project of projects) await ensureProject(project);

  const counts = await Promise.all([prisma.promotion.count(), prisma.catalogItem.count(), prisma.project.count()]);
  console.log(`[seed] promotions ${counts[0]}, catalog items ${counts[1]}, projects ${counts[2]}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
