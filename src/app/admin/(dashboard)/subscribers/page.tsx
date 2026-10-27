import type { Metadata } from "next";

import type { ChannelStatus, Prisma } from "@/generated/prisma/client";
import { Card, Chips, Empty, Flash, PageHeader, StatusPill } from "@/components/admin/bits";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Button, ButtonLink, Field, Input, Select, Textarea } from "@/components/ui";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { formatUsPhone } from "@/lib/phone";

import { addSubscriber, removeSubscriber, resendConfirmation, stopChannel } from "./actions";

export const metadata: Metadata = { title: "Subscribers" };

type Params = { q?: string; status?: string; ok?: string; error?: string };
const STATUS_FILTERS: ChannelStatus[] = ["ACTIVE", "PENDING", "STOPPED"];
const SOURCE_LABELS = { WEB: "Website", IN_STORE: "In store", PHONE: "By phone", IMPORT: "Imported" } as const;
const LIMIT = 300;

export default async function AdminSubscribersPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin("/admin/subscribers");
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status = STATUS_FILTERS.includes(params.status as ChannelStatus) ? (params.status as ChannelStatus) : null;

  const digits = q.replace(/\D/g, "");
  const search: Prisma.SubscriberWhereInput[] = q
    ? [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : [])]
    : [];
  const where: Prisma.SubscriberWhereInput = {
    ...(search.length ? { OR: search } : {}),
    ...(status ? { AND: [{ OR: [{ smsStatus: status }, { emailStatus: status }] }] } : {}),
  };

  const [rows, total, smsActive, smsPending, smsStopped, emailActive, emailPending] = await Promise.all([
    prisma.subscriber.findMany({ where, orderBy: { createdAt: "desc" }, take: LIMIT }),
    prisma.subscriber.count(),
    prisma.subscriber.count({ where: { smsStatus: "ACTIVE" } }),
    prisma.subscriber.count({ where: { smsStatus: "PENDING" } }),
    prisma.subscriber.count({ where: { smsStatus: "STOPPED" } }),
    prisma.subscriber.count({ where: { emailStatus: "ACTIVE" } }),
    prisma.subscriber.count({ where: { emailStatus: "PENDING" } }),
  ]);

  const chip = (href: string, label: string, active: boolean) => ({ href: q ? `${href}${href.includes("?") ? "&" : "?"}q=${encodeURIComponent(q)}` : href, label, active });

  return (
    <>
      <PageHeader
        title="Subscribers"
        action={
          <ButtonLink href="/api/admin/subscribers/csv" variant="outline" prefetch={false}>
            Export CSV
          </ButtonLink>
        }
      >
        <p className="m-0 text-[14px] text-muted">
          {total} people · texts: <strong>{smsActive} confirmed</strong>, {smsPending} pending, {smsStopped} stopped · email: <strong>{emailActive} confirmed</strong>, {emailPending} pending
        </p>
      </PageHeader>
      <Flash params={params} />

      <Card title="Add someone at the counter" className="mb-5">
        <form id="add" action={addSubscriber} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <Input name="name" autoComplete="off" maxLength={80} placeholder="Dale Johnson" />
            </Field>
            <Field label="Mobile number">
              <Input name="phone" type="tel" inputMode="tel" autoComplete="off" placeholder="(660) 555-0123" />
            </Field>
            <Field label="Email (optional)">
              <Input name="email" type="email" inputMode="email" autoComplete="off" placeholder="dale@example.com" />
            </Field>
            <Field label="Where did they ask?">
              <Select name="source" defaultValue="IN_STORE">
                <option value="IN_STORE">In the store</option>
                <option value="PHONE">Over the phone</option>
              </Select>
            </Field>
          </div>
          <Field label="Note (optional)" hint="Only you see this.">
            <Textarea name="note" rows={2} maxLength={500} placeholder="Wants to hear about the fall flyer" />
          </Field>
          <SubmitButton pendingText="Adding…" className="h-14 text-[17px]">
            Add and send confirmation
          </SubmitButton>
          <p className="m-0 text-[13px] text-muted">They get a text asking them to reply YES (and an email link if you gave an email). Alerts only go to people who confirm.</p>
        </form>
      </Card>

      <form action="/admin/subscribers" method="get" className="mb-3 flex gap-2">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <Input name="q" type="search" defaultValue={q} placeholder="Search name, phone or email" aria-label="Search subscribers" />
        <Button type="submit" variant="ink" className="shrink-0">
          Search
        </Button>
      </form>
      <Chips items={[chip("/admin/subscribers", "Everyone", !status), ...STATUS_FILTERS.map((s) => chip(`/admin/subscribers?status=${s}`, s === "ACTIVE" ? "Confirmed" : s === "PENDING" ? "Pending" : "Stopped", status === s))]} />

      {rows.length === 0 ? (
        <Empty className="mt-4">{q || status ? "No one matches." : "No subscribers yet."}</Empty>
      ) : (
        <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
          {rows.map((s) => {
            const label = s.name || formatUsPhone(s.phone) || s.email || "Subscriber";
            const canResend = (s.phone && s.smsStatus !== "ACTIVE" && s.smsStatus !== "STOPPED") || (s.email && s.emailStatus !== "ACTIVE" && s.emailStatus !== "STOPPED");
            return (
              <li key={s.id} className="rounded-md border border-line bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[16px] font-bold">{s.name || <span className="text-muted">No name</span>}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px]">
                      {s.phone ? (
                        <span className="flex items-center gap-1.5">
                          <a href={`tel:${s.phone}`} className="font-semibold underline">
                            {formatUsPhone(s.phone)}
                          </a>
                          <StatusPill status={s.smsStatus} />
                        </span>
                      ) : null}
                      {s.email ? (
                        <span className="flex items-center gap-1.5">
                          <a href={`mailto:${s.email}`} className="break-all font-semibold underline">
                            {s.email}
                          </a>
                          <StatusPill status={s.emailStatus} />
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-[13px] text-muted">
                      {SOURCE_LABELS[s.consentSource]} · joined {fmtDate(s.createdAt)}
                      {s.stoppedAt ? ` · stopped ${fmtDate(s.stoppedAt)}` : ""}
                      {s.notes ? ` · ${s.notes.split("\n")[0]}` : ""}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {canResend ? (
                    <form action={resendConfirmation}>
                      <input type="hidden" name="id" value={s.id} />
                      <Button type="submit" variant="outline" className="min-h-10 px-3 text-[13px]">
                        Resend confirmation
                      </Button>
                    </form>
                  ) : null}
                  {s.phone && s.smsStatus !== "STOPPED" ? (
                    <form action={stopChannel}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="channel" value="sms" />
                      <Button type="submit" variant="outline" className="min-h-10 px-3 text-[13px]">
                        Stop texts
                      </Button>
                    </form>
                  ) : null}
                  {s.email && s.emailStatus !== "STOPPED" ? (
                    <form action={stopChannel}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="channel" value="email" />
                      <Button type="submit" variant="outline" className="min-h-10 px-3 text-[13px]">
                        Stop emails
                      </Button>
                    </form>
                  ) : null}
                  <form action={removeSubscriber}>
                    <input type="hidden" name="id" value={s.id} />
                    <ConfirmButton message={`Remove ${label} completely? Their consent record goes too.`} variant="outline" className="min-h-10 border-brand px-3 text-[13px] text-brand hover:bg-brand hover:text-white">
                      Remove
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            );
          })}
          {rows.length === LIMIT ? <li className="text-center text-[13px] text-muted">Showing the newest {LIMIT}. Search to narrow it down, or export the CSV for everyone.</li> : null}
        </ul>
      )}
    </>
  );
}
