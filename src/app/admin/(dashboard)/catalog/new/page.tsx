import type { Metadata } from "next";

import { Card, Flash, PageHeader } from "@/components/admin/bits";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/db";

import { CatalogForm } from "../CatalogForm";

export const metadata: Metadata = { title: "Add item" };

export default async function NewCatalogItemPage({ searchParams }: { searchParams: Promise<{ error?: string; cat?: string }> }) {
  await requireAdmin("/admin/catalog/new");
  const params = await searchParams;
  const promotions = await prisma.promotion.findMany({ orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }], select: { id: true, title: true, publishedAt: true }, take: 50 });
  return (
    <div className="mx-auto max-w-[640px]">
      <PageHeader title="Add item" back={{ href: "/admin/catalog", label: "Deals & Blinds" }} />
      <Flash params={params} />
      <Card>
        <CatalogForm item={null} promotions={promotions} defaultCategory={params.cat} />
      </Card>
    </div>
  );
}
