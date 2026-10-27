import type { Metadata } from "next";
import Link from "next/link";

import type { CatalogCategory } from "@/generated/prisma/client";
import { Chips, Empty, Flash, PageHeader, Pill } from "@/components/admin/bits";
import { MediaImage } from "@/components/MediaImage";
import { ButtonLink } from "@/components/ui";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { CATALOG_CATEGORIES, CATALOG_CATEGORY_LABELS } from "@/lib/labels";

export const metadata: Metadata = { title: "Deals & Blinds" };

type Params = { cat?: string; ok?: string; error?: string };

export default async function AdminCatalogPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin("/admin/catalog");
  const params = await searchParams;
  const cat = CATALOG_CATEGORIES.includes(params.cat as CatalogCategory) ? (params.cat as CatalogCategory) : null;

  const items = await prisma.catalogItem.findMany({
    where: cat ? { category: cat } : undefined,
    orderBy: [{ category: "asc" }, { active: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
  const categories = CATALOG_CATEGORIES.filter((c) => items.some((i) => i.category === c));

  return (
    <>
      <PageHeader
        title="Deals & Blinds"
        action={
          <div className="flex gap-2">
            <ButtonLink href="/admin/catalog/featured" variant="outline">
              Top deals
            </ButtonLink>
            <ButtonLink href={`/admin/catalog/new${cat ? `?cat=${cat}` : ""}`}>Add item</ButtonLink>
          </div>
        }
      />
      <Flash params={params} />
      <Chips items={[{ href: "/admin/catalog", label: "All", active: !cat }, ...CATALOG_CATEGORIES.map((c) => ({ href: `/admin/catalog?cat=${c}`, label: CATALOG_CATEGORY_LABELS[c], active: cat === c }))]} />

      {items.length === 0 ? <Empty className="mt-4">Nothing here yet. Add a blind or this month&apos;s top Milwaukee deals.</Empty> : null}

      <div className="mt-4 flex flex-col gap-6">
        {categories.map((category) => (
          <section key={category}>
            <h2 className="eyebrow m-0 mb-2 text-[13px] text-muted">{CATALOG_CATEGORY_LABELS[category]}</h2>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {items
                .filter((i) => i.category === category)
                .map((item) => (
                  <li key={item.id}>
                    <Link href={`/admin/catalog/${item.id}`} className="flex min-h-16 items-center gap-3 rounded-md border border-line bg-white p-3 hover:border-ink">
                      <MediaImage imageKey={item.imageKeys[0]} alt="" size="thumb" className="h-14 w-14 shrink-0 rounded object-cover" fallback="" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {item.featured ? (
                            <span aria-label="Top deal" title="Top deal" className="text-brand">
                              ★
                            </span>
                          ) : null}
                          <span className="truncate text-[16px] font-bold">{item.name}</span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-muted">
                          <span className="font-bold text-ink">{formatMoney(item.priceCents, item.priceNote)}</span>
                          {item.badge ? <Pill tone="ink">{item.badge}</Pill> : null}
                          {item.stockNote ? <span>{item.stockNote}</span> : null}
                          {!item.active ? <Pill tone="gray">hidden</Pill> : null}
                        </div>
                      </div>
                      <span aria-hidden className="text-muted">
                        ›
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
