import type { Metadata } from "next";
import Link from "next/link";

import { Empty, Flash, PageHeader, Pill } from "@/components/admin/bits";
import { MediaImage } from "@/components/MediaImage";
import { ButtonLink } from "@/components/ui";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { fmtDateRange, fmtEventWhen } from "@/lib/format";

export const metadata: Metadata = { title: "Promotions" };

type Params = { ok?: string; error?: string };

export default async function AdminPromotionsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin("/admin/promotions");
  const params = await searchParams;
  const now = new Date();

  const rows = await prisma.promotion.findMany({
    orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
    include: { broadcasts: { select: { smsSent: true, emailSent: true } } },
  });

  type Row = (typeof rows)[number];
  const groups: Array<{ title: string; items: Row[]; hint?: string }> = [
    { title: "Live now", items: [] },
    { title: "Upcoming", items: [], hint: "Published, but the start date hasn't arrived." },
    { title: "Drafts", items: [], hint: "Only you can see these." },
    { title: "Ended", items: [] },
  ];
  for (const row of rows) {
    if (!row.publishedAt) groups[2].items.push(row);
    else if (row.endsAt && row.endsAt < now) groups[3].items.push(row);
    else if (row.startsAt && row.startsAt > now) groups[1].items.push(row);
    else groups[0].items.push(row);
  }

  return (
    <>
      <PageHeader title="Promotions" action={<ButtonLink href="/admin/promotions/new">New promotion</ButtonLink>} />
      <Flash params={params} />
      {rows.length === 0 ? <Empty>No promotions yet. Start with this month&apos;s flyer.</Empty> : null}
      <div className="flex flex-col gap-6">
        {groups
          .filter((g) => g.items.length)
          .map((group) => (
            <section key={group.title}>
              <h2 className="eyebrow m-0 text-[13px] text-muted">
                {group.title} <span className="font-sans tracking-normal">({group.items.length})</span>
              </h2>
              {group.hint ? <p className="mb-2 mt-0.5 text-[13px] text-muted">{group.hint}</p> : <div className="mb-2" />}
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {group.items.map((row) => {
                  const sent = row.broadcasts.reduce((n, b) => n + b.smsSent + b.emailSent, 0);
                  return (
                    <li key={row.id}>
                      <Link href={`/admin/promotions/${row.id}`} className="flex min-h-16 items-center gap-3 rounded-md border border-line bg-white p-3 hover:border-ink">
                        <MediaImage imageKey={row.imageKey} alt="" size="thumb" className="h-14 w-14 shrink-0 rounded object-cover" fallback="" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Pill tone={row.kind === "EVENT" ? "brand" : "ink"}>{row.kind === "EVENT" ? "Event" : "Promo"}</Pill>
                            <span className="truncate text-[16px] font-bold">{row.title}</span>
                          </div>
                          <div className="mt-0.5 text-[13px] text-muted">
                            {row.kind === "EVENT" ? fmtEventWhen(row.startsAt, row.endsAt) : fmtDateRange(row.startsAt, row.endsAt) || "No dates"}
                            {" · "}
                            {row.publishedAt ? "Published" : "Draft"}
                            {row.broadcasts.length ? ` · ${row.broadcasts.length} alert${row.broadcasts.length === 1 ? "" : "s"}, ${sent} sent` : " · No alerts sent"}
                          </div>
                        </div>
                        <span aria-hidden className="text-muted">
                          ›
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
      </div>
    </>
  );
}
