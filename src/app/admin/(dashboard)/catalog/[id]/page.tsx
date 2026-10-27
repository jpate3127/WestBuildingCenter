import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, Flash, PageHeader } from "@/components/admin/bits";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/db";

import { CatalogForm } from "../CatalogForm";

export const metadata: Metadata = { title: "Edit item" };

export default async function EditCatalogItemPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/catalog/${id}`);
  const query = await searchParams;
  const [item, promotions] = await Promise.all([
    prisma.catalogItem.findUnique({ where: { id } }),
    prisma.promotion.findMany({ orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }], select: { id: true, title: true, publishedAt: true }, take: 50 }),
  ]);
  if (!item) notFound();
  const publicHref = item.category === "BLIND" ? `/blinds/${item.slug}` : `/products/${item.slug}`;
  return (
    <div className="mx-auto max-w-[640px]">
      <PageHeader title={item.name} back={{ href: `/admin/catalog?cat=${item.category}`, label: "Deals & Blinds" }}>
        <p className="m-0 text-[14px] text-muted">
          {item.active ? (
            <Link href={publicHref} target="_blank" className="font-semibold text-brand underline">
              {publicHref}
            </Link>
          ) : (
            "Hidden from the site."
          )}
        </p>
      </PageHeader>
      <Flash params={query} />
      <Card>
        <CatalogForm item={item} promotions={promotions} />
      </Card>
    </div>
  );
}
