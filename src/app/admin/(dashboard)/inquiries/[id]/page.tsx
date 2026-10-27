import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Card, DefinitionList, Flash, PageHeader, Pill, StatusPill } from "@/components/admin/bits";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { MediaImage } from "@/components/MediaImage";
import { Button, Field, Textarea, cx } from "@/components/ui";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { INQUIRY_TYPE_LABELS } from "@/lib/labels";
import { isImageKey, mediaUrl } from "@/lib/media";
import { formatUsPhone } from "@/lib/phone";

import { deleteInquiry, saveInquiryNotes, setInquiryStatus } from "../actions";

export const metadata: Metadata = { title: "Message" };

const STATUS_BUTTONS = [
  { status: "NEW", label: "New" },
  { status: "REPLIED", label: "Replied" },
  { status: "CLOSED", label: "Closed" },
] as const;

/** "projectType" → "Project type", for the meta list. */
function humanize(key: string): string {
  const spaced = key.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

export default async function InquiryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/inquiries/${id}`);
  const query = await searchParams;
  const inquiry = await prisma.inquiry.findUnique({ where: { id } });
  if (!inquiry) notFound();

  const meta = inquiry.meta && typeof inquiry.meta === "object" && !Array.isArray(inquiry.meta) ? Object.entries(inquiry.meta as Record<string, unknown>) : [];
  const metaItems: Array<[string, string]> = meta
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => [humanize(k), Array.isArray(v) ? v.map(String).join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v)]);

  return (
    <div className="mx-auto max-w-[640px]">
      <PageHeader title={inquiry.name} back={{ href: "/admin/inquiries", label: "Inbox" }}>
        <p className="m-0 flex flex-wrap items-center gap-2 text-[14px] text-muted">
          <Pill tone={inquiry.type === "PROJECT_ESTIMATE" ? "brand" : "ink"}>{INQUIRY_TYPE_LABELS[inquiry.type]}</Pill>
          <StatusPill status={inquiry.status} />
          <span>{fmtDateTime(inquiry.createdAt)}</span>
        </p>
      </PageHeader>
      <Flash params={query} />

      <Card className="mb-4">
        <DefinitionList
          items={[
            ...(inquiry.company ? ([["Company", inquiry.company]] as Array<[string, React.ReactNode]>) : []),
            [
              "Phone",
              inquiry.phone ? (
                <a href={`tel:${inquiry.phone}`} className="font-bold text-brand underline">
                  {formatUsPhone(inquiry.phone) || inquiry.phone}
                </a>
              ) : (
                "—"
              ),
            ],
            [
              "Email",
              inquiry.email ? (
                <a href={`mailto:${inquiry.email}?subject=${encodeURIComponent(`Re: your ${INQUIRY_TYPE_LABELS[inquiry.type].toLowerCase()} request`)}`} className="break-all font-bold text-brand underline">
                  {inquiry.email}
                </a>
              ) : (
                "—"
              ),
            ],
            ...metaItems,
          ]}
        />
        <h2 className="eyebrow mb-1 mt-4 text-[13px] text-muted">Message</h2>
        <p className="m-0 whitespace-pre-wrap break-words text-[16px]">{inquiry.message || "(no message)"}</p>
      </Card>

      {inquiry.fileKeys.length ? (
        <Card title="Attached files" className="mb-4">
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3">
            {inquiry.fileKeys.map((key, index) => (
              <li key={key}>
                <a href={mediaUrl(key)} target="_blank" rel="noreferrer" className="flex flex-col gap-1 rounded border border-line p-2 text-[13px] font-semibold text-brand">
                  {isImageKey(key) ? (
                    <MediaImage imageKey={key} alt={`Attachment ${index + 1}`} size="thumb" className="aspect-square w-full rounded object-cover" />
                  ) : (
                    <span className="flex aspect-square w-full items-center justify-center rounded bg-paper text-[22px] font-bold text-ink">PDF</span>
                  )}
                  <span className="underline">{isImageKey(key) ? `Photo ${index + 1}` : `File ${index + 1}`}</span>
                </a>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card title="Status" className="mb-4">
        <div className="grid grid-cols-3 gap-2">
          {STATUS_BUTTONS.map((b) => (
            <form key={b.status} action={setInquiryStatus}>
              <input type="hidden" name="id" value={inquiry.id} />
              <input type="hidden" name="status" value={b.status} />
              <Button type="submit" full variant={inquiry.status === b.status ? "ink" : "outline"} className={cx("text-[15px]", inquiry.status === b.status && "pointer-events-none")} aria-pressed={inquiry.status === b.status}>
                {b.label}
              </Button>
            </form>
          ))}
        </div>
      </Card>

      <Card title="Internal notes" className="mb-4">
        <form action={saveInquiryNotes} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={inquiry.id} />
          <Field label="Notes" hint="What you quoted, who called back. Only you see this.">
            <Textarea name="notes" rows={4} defaultValue={inquiry.notes ?? ""} maxLength={4000} />
          </Field>
          <SubmitButton variant="ink">Save notes</SubmitButton>
        </form>
      </Card>

      <form action={deleteInquiry}>
        <input type="hidden" name="id" value={inquiry.id} />
        <ConfirmButton message={`Delete this message from ${inquiry.name}? Attached files are removed too.`} variant="outline" full className="border-brand text-brand hover:bg-brand hover:text-white">
          Delete message
        </ConfirmButton>
      </form>
    </div>
  );
}
