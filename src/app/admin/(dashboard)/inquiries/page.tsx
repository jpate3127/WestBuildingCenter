import type { Metadata } from "next";
import Link from "next/link";

import type { InquiryStatus, InquiryType, Prisma } from "@/generated/prisma/client";
import { Chips, Empty, Flash, PageHeader, Pill, StatusPill } from "@/components/admin/bits";
import { firstLine } from "@/components/admin/form";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { INQUIRY_TYPE_LABELS } from "@/lib/labels";
import { formatUsPhone } from "@/lib/phone";

export const metadata: Metadata = { title: "Inbox" };

type Params = { type?: string; status?: string; ok?: string; error?: string };
const TYPES = Object.keys(INQUIRY_TYPE_LABELS) as InquiryType[];
const STATUSES: InquiryStatus[] = ["NEW", "REPLIED", "CLOSED"];

export default async function AdminInquiriesPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin("/admin/inquiries");
  const params = await searchParams;
  const type = TYPES.includes(params.type as InquiryType) ? (params.type as InquiryType) : null;
  const status = STATUSES.includes(params.status as InquiryStatus) ? (params.status as InquiryStatus) : null;

  const where: Prisma.InquiryWhereInput = { ...(type ? { type } : {}), ...(status ? { status } : {}) };
  const [rows, newCount] = await Promise.all([prisma.inquiry.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }), prisma.inquiry.count({ where: { status: "NEW" } })]);

  const href = (t: InquiryType | null, s: InquiryStatus | null) => {
    const qs = new URLSearchParams();
    if (t) qs.set("type", t);
    if (s) qs.set("status", s);
    const text = qs.toString();
    return `/admin/inquiries${text ? `?${text}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Inbox">
        <p className="m-0 text-[14px] text-muted">Every form on the site lands here. {newCount} new.</p>
      </PageHeader>
      <Flash params={params} />
      <div className="flex flex-col gap-2">
        <Chips items={[{ href: href(type, null), label: "Any status", active: !status }, ...STATUSES.map((s) => ({ href: href(type, s), label: s === "NEW" ? "New" : s === "REPLIED" ? "Replied" : "Closed", active: status === s }))]} />
        <Chips items={[{ href: href(null, status), label: "All types", active: !type }, ...TYPES.map((t) => ({ href: href(t, status), label: INQUIRY_TYPE_LABELS[t], active: type === t }))]} />
      </div>

      {rows.length === 0 ? (
        <Empty className="mt-4">Nothing here.</Empty>
      ) : (
        <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
          {rows.map((row) => (
            <li key={row.id} className={`rounded-md border bg-white p-3 ${row.status === "NEW" ? "border-l-4 border-l-brand border-line" : "border-line"}`}>
              <Link href={`/admin/inquiries/${row.id}`} className="block">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={row.type === "PROJECT_ESTIMATE" ? "brand" : "ink"}>{INQUIRY_TYPE_LABELS[row.type]}</Pill>
                  <StatusPill status={row.status} />
                  <span className="ml-auto text-[13px] text-muted">{fmtDateTime(row.createdAt)}</span>
                </div>
                <div className="mt-1.5 text-[16px] font-bold">
                  {row.name}
                  {row.company ? <span className="font-medium text-muted"> · {row.company}</span> : null}
                </div>
                <p className="mb-0 mt-0.5 text-[14px] text-muted">{firstLine(row.message, 120) || "(no message)"}</p>
              </Link>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px]">
                {row.phone ? (
                  <a href={`tel:${row.phone}`} className="font-semibold text-brand underline">
                    {formatUsPhone(row.phone) || row.phone}
                  </a>
                ) : null}
                {row.email ? (
                  <a href={`mailto:${row.email}`} className="break-all font-semibold text-brand underline">
                    {row.email}
                  </a>
                ) : null}
                {row.fileKeys.length ? <span className="text-muted">{row.fileKeys.length} file{row.fileKeys.length === 1 ? "" : "s"}</span> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
