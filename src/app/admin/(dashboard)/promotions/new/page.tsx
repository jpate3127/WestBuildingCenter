import type { Metadata } from "next";

import { Card, Flash, PageHeader } from "@/components/admin/bits";
import { requireAdmin } from "@/lib/authz";

import { PromotionForm } from "../PromotionForm";

export const metadata: Metadata = { title: "New promotion" };

export default async function NewPromotionPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin("/admin/promotions/new");
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-[640px]">
      <PageHeader title="New promotion" back={{ href: "/admin/promotions", label: "Promotions" }} />
      <Flash params={params} />
      <Card>
        <PromotionForm promotion={null} />
      </Card>
    </div>
  );
}
