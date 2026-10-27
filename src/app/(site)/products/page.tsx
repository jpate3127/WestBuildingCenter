import type { Metadata } from "next";
import Link from "next/link";

import type { CatalogCategory } from "@/generated/prisma/client";
import { CallBlock, PageHeader, Pill, SectionLead } from "@/components/site/blocks";
import { PickCard } from "@/components/site/cards";
import { ButtonLink, Heading, Section } from "@/components/ui";
import { CATALOG_CATEGORIES, CATALOG_CATEGORY_LABELS } from "@/lib/labels";
import { getCatalogByCategory } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Products & Brands",
  description: "Lumber, Milwaukee tools, electrical, plumbing, paint, doors and windows, Fiberon decking, Aristokraft and Wolf cabinets, Woodford hydrants and more at West Building Center, Atlanta, MO.",
};

const CATEGORIES: Array<{ title: string; sub: string; href?: string }> = [
  { title: "Lumber & building materials", sub: "Framing, treated, sheathing, LP SmartSide, trusses by order" },
  { title: "Milwaukee tools", sub: "M18 and M12, batteries, bits and blades. Monthly flyer deals", href: "/promotions" },
  { title: "Electrical", sub: "Wire, boxes, breakers, fixtures, farm and shop service" },
  { title: "Plumbing", sub: "PEX, PVC, fittings, water heaters, sump pumps" },
  { title: "Paint & supplies", sub: "Interior, exterior, stain, brushes and rollers" },
  { title: "Doors & windows", sub: "Special-ordered to your openings, delivered to the job" },
  { title: "Decking & railing", sub: "Fiberon composite, RDI railing, Perma-Column posts" },
  { title: "Kitchens & cabinets", sub: "Aristokraft and Wolf cabinets, countertops, design help" },
  { title: "Outdoor", sub: "Oklahoma Joe and Bayou Classic cookers, Muddy & Hawk blinds, Tactacam", href: "/blinds" },
  { title: "Farm & hydrants", sub: "Woodford yard hydrants, fence supplies, gate hardware" },
];

const BRANDS = ["Milwaukee", "Muddy", "Hawk", "Fiberon", "Aristokraft", "Wolf", "Woodford", "LP SmartSide", "Oklahoma Joe", "Tactacam", "Case", "Freud", "Schlage", "RDI", "Roman Stone", "Bayou Classic"];

export default async function ProductsPage() {
  const categories = CATALOG_CATEGORIES.filter((c): c is Exclude<CatalogCategory, "BLIND"> => c !== "BLIND");
  const lists = await Promise.all(categories.map((c) => getCatalogByCategory(c)));
  const groups = categories.map((category, i) => ({ category, items: lists[i] })).filter((g) => g.items.length > 0);

  return (
    <>
      <PageHeader eyebrow="Products & brands" title="What we carry" text="A real lumber yard with a hardware store up front. If it's not on the shelf, we'll order it and have it in a few days." tone="paper">
        <ButtonLink href="/promotions">This month&apos;s deals</ButtonLink>
        <ButtonLink href="/contact" variant="outline">
          Ask if we have it
        </ButtonLink>
      </PageHeader>

      <Section>
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => {
            const inner = (
              <>
                <span className="display block text-[24px] text-ink">{c.title}</span>
                <span className="mt-1 block text-[15px] text-muted">{c.sub}</span>
                {c.href ? <span className="mt-2 block font-bold text-brand">See more →</span> : null}
              </>
            );
            return (
              <li key={c.title} className="rounded-md border border-line bg-white">
                {c.href ? (
                  <Link href={c.href} className="block p-4 sm:p-5">
                    {inner}
                  </Link>
                ) : (
                  <div className="p-4 sm:p-5">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-10">
          <Heading size="sm">Brands we carry</Heading>
          <div className="mt-3 flex flex-wrap gap-2">
            {BRANDS.map((b) => (
              <Pill key={b}>{b}</Pill>
            ))}
          </div>
        </div>
      </Section>

      {groups.length ? (
        <Section tone="paper">
          <SectionLead eyebrow="In the store now" title="On the shelf this week" text="A few of the things we have in stock, with prices. Tap one for details or the flyer it came from." />
          <div className="mt-6 flex flex-col gap-10">
            {groups.map(({ category, items }) => (
              <div key={category}>
                <Heading as="h3" size="sm">
                  {CATALOG_CATEGORY_LABELS[category]}
                </Heading>
                <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-3">
                  {items.map((item) => (
                    <div key={item.id}>
                      <div className="sm:hidden">
                        <PickCard item={item} compact />
                      </div>
                      <div className="hidden sm:block">
                        <PickCard item={item} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      <Section>
        <CallBlock title="Don't see it? We'll order it." text="Most special orders are here in two to five days. Tell us what you need and we'll quote it." label="Call">
          <div className="mt-3">
            <ButtonLink href="/contact" variant="outline-white" className="w-full sm:w-auto">
              Send us a note
            </ButtonLink>
          </div>
        </CallBlock>
      </Section>
    </>
  );
}
