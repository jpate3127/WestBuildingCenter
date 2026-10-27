import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, Empty, Flash, PageHeader, StatusPill } from "@/components/admin/bits";
import { SendAlertForm } from "@/components/admin/SendAlertForm";
import { Notice } from "@/components/ui";
import { requireAdmin } from "@/lib/authz";
import { broadcastPreview, draftEmailSubject, draftSmsText } from "@/lib/broadcast";
import { prisma } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";

import { sendAlert } from "../actions";
import { PromotionForm } from "../PromotionForm";

export const metadata: Metadata = { title: "Edit promotion" };

type Params = { error?: string; saved?: string; sent?: string };

export default async function EditPromotionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Params> }) {
  const { id } = await params;
  await requireAdmin(`/admin/promotions/${id}`);
  const query = await searchParams;

  const promotion = await prisma.promotion.findUnique({
    where: { id },
    include: { broadcasts: { orderBy: { createdAt: "desc" } }, _count: { select: { catalogItems: true } } },
  });
  if (!promotion) notFound();
  const preview = promotion.publishedAt ? await broadcastPreview() : null;

  return (
    <div className="mx-auto max-w-[640px]">
      <PageHeader title={promotion.title} back={{ href: "/admin/promotions", label: "Promotions" }}>
        <p className="m-0 text-[14px] text-muted">
          {promotion.publishedAt ? (
            <>
              Live at{" "}
              <Link href={`/promotions/${promotion.slug}`} target="_blank" className="font-semibold text-brand underline">
                /promotions/{promotion.slug}
              </Link>
            </>
          ) : (
            "Draft, not on the site yet."
          )}
          {promotion._count.catalogItems ? ` · ${promotion._count.catalogItems} deal${promotion._count.catalogItems === 1 ? "" : "s"} linked` : ""}
        </p>
      </PageHeader>
      <Flash params={query} />

      <Card title="Send alert" className="mb-5">
        {preview ? (
          <SendAlertForm promotionId={promotion.id} action={sendAlert} preview={preview} smsDraft={draftSmsText(promotion)} emailSubjectDraft={draftEmailSubject(promotion)} />
        ) : (
          <Notice>Publish the promotion (checkbox below, then Save) to send a text or email alert.</Notice>
        )}
      </Card>

      <Card title="Details">
        <PromotionForm promotion={promotion} />
      </Card>

      <Card title="Alerts sent" className="mt-5">
        {promotion.broadcasts.length === 0 ? (
          <Empty>No alerts sent for this promotion.</Empty>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {promotion.broadcasts.map((b) => (
              <li key={b.id} className="rounded border border-line px-3 py-2.5 text-[14px]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{fmtDateTime(b.createdAt)}</span>
                  <StatusPill status={b.status} />
                </div>
                <div className="mt-1 text-muted">
                  By {b.sentBy}
                  {b.smsText ? ` · texts: ${b.smsSent} sent${b.smsFailed ? `, ${b.smsFailed} failed` : ""}` : ""}
                  {b.emailSubject ? ` · emails: ${b.emailSent} sent${b.emailFailed ? `, ${b.emailFailed} failed` : ""}` : ""}
                </div>
                {b.smsText ? <div className="mt-1 whitespace-pre-wrap break-words text-[13px]">{b.smsText}</div> : null}
                {b.error ? <div className="mt-1 text-[13px] font-semibold text-brand">{b.error}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
