import type { Metadata } from "next";

import { Card, Flash, PageHeader, Pill } from "@/components/admin/bits";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Field, Input } from "@/components/ui";
import { envAdminEmails } from "@/lib/auth";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/format";

import { addAdmin, removeAdmin } from "./actions";

export const metadata: Metadata = { title: "Admins" };

export default async function AdminsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const admin = await requireAdmin("/admin/admins");
  const params = await searchParams;
  const envEmails = envAdminEmails();
  const rows = await prisma.admin.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="mx-auto max-w-[640px]">
      <PageHeader title="Admins">
        <p className="m-0 text-[14px] text-muted">Who can open this admin. Each person signs in with their own Google account.</p>
      </PageHeader>
      <Flash params={params} />

      <Card title="Add an admin" className="mb-5">
        <form action={addAdmin} className="flex flex-col gap-3">
          <Field label="Google email">
            <Input name="email" type="email" inputMode="email" autoComplete="off" required maxLength={120} placeholder="name@gmail.com" />
          </Field>
          <Field label="Name (optional)">
            <Input name="name" autoComplete="off" maxLength={80} />
          </Field>
          <SubmitButton pendingText="Adding…">Add admin</SubmitButton>
        </form>
      </Card>

      <Card title="Current admins">
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {envEmails.map((email) => (
            <li key={email} className="flex flex-wrap items-center justify-between gap-2 rounded border border-line px-3 py-2.5">
              <span className="break-all font-semibold">
                {email}
                {email === admin.email ? <span className="text-muted"> (you)</span> : null}
              </span>
              <Pill tone="gray">from environment, can&apos;t be removed here</Pill>
            </li>
          ))}
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-line px-3 py-2.5">
              <span className="min-w-0">
                <span className="break-all font-semibold">
                  {row.email}
                  {row.email === admin.email ? <span className="text-muted"> (you)</span> : null}
                </span>
                <span className="block text-[13px] text-muted">
                  {row.name ? `${row.name} · ` : ""}added {fmtDate(row.createdAt)}
                  {row.addedBy ? ` by ${row.addedBy}` : ""}
                </span>
              </span>
              {row.email === admin.email ? null : (
                <form action={removeAdmin}>
                  <input type="hidden" name="id" value={row.id} />
                  <ConfirmButton message={`Remove ${row.email}? They won't be able to sign in anymore.`} variant="outline" className="min-h-10 border-brand px-3 text-[13px] text-brand hover:bg-brand hover:text-white">
                    Remove
                  </ConfirmButton>
                </form>
              )}
            </li>
          ))}
          {envEmails.length === 0 && rows.length === 0 ? <li className="text-[14px] text-muted">No admins listed. Set ADMIN_EMAILS on the server so the owners can always get in.</li> : null}
        </ul>
      </Card>
    </div>
  );
}
