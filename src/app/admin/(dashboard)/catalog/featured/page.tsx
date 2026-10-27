import type { Metadata } from "next";
import Link from "next/link";

import { Empty, PageHeader, Pill } from "@/components/admin/bits";
import { MediaImage } from "@/components/MediaImage";
import { Button, ButtonLink } from "@/components/ui";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";

import { moveFeatured, unfeature } from "../actions";

export const metadata: Metadata = { title: "Top deals" };

const HOMEPAGE_LIMIT = 6;

/** The homepage "Top deals" picker: featured items in the order they show. */
export default async function FeaturedPage() {
  await requireAdmin("/admin/catalog/featured");
  const items = await prisma.catalogItem.findMany({ where: { featured: true }, orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }] });
  const visible = items.filter((i) => i.active).slice(0, HOMEPAGE_LIMIT).map((i) => i.id);

  return (
    <div className="mx-auto max-w-[640px]">
      <PageHeader title="Top deals" back={{ href: "/admin/catalog", label: "Deals & Blinds" }} action={<ButtonLink href="/admin/catalog/new?cat=TOOL">Add a deal</ButtonLink>}>
        <p className="m-0 text-[14px] text-muted">The first {HOMEPAGE_LIMIT} active items here show on the homepage, in this order. Check “Top deal” on any item to add it.</p>
      </PageHeader>

      {items.length === 0 ? (
        <Empty>No top deals yet. Open an item and check “Top deal on the homepage”.</Empty>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-center gap-3 rounded-md border border-line bg-white p-3">
              <span className="display w-6 text-center text-[22px] text-muted">{index + 1}</span>
              <MediaImage imageKey={item.imageKeys[0]} alt="" size="thumb" className="h-14 w-14 shrink-0 rounded object-cover" fallback="" />
              <div className="min-w-0 flex-1">
                <Link href={`/admin/catalog/${item.id}`} className="block truncate text-[16px] font-bold hover:underline">
                  {item.name}
                </Link>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-muted">
                  <span className="font-bold text-ink">{formatMoney(item.priceCents, item.priceNote)}</span>
                  {!item.active ? <Pill tone="gray">hidden</Pill> : visible.includes(item.id) ? <Pill tone="green">on homepage</Pill> : <Pill tone="yellow">past the first {HOMEPAGE_LIMIT}</Pill>}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <form action={moveFeatured}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="direction" value="up" />
                  <Button type="submit" variant="outline" disabled={index === 0} aria-label={`Move ${item.name} up`} className="min-h-11 w-11 px-0 py-0">
                    ↑
                  </Button>
                </form>
                <form action={moveFeatured}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="direction" value="down" />
                  <Button type="submit" variant="outline" disabled={index === items.length - 1} aria-label={`Move ${item.name} down`} className="min-h-11 w-11 px-0 py-0">
                    ↓
                  </Button>
                </form>
              </div>
              <form action={unfeature}>
                <input type="hidden" name="id" value={item.id} />
                <Button type="submit" variant="outline" aria-label={`Remove ${item.name} from top deals`} className="min-h-11 w-11 px-0 py-0 text-muted">
                  ✕
                </Button>
              </form>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
