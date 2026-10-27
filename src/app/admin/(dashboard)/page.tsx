import { Card, Flash, PageHeader, Pill, Tile } from "@/components/admin/bits";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { ButtonLink, Field, Input } from "@/components/ui";
import { isGoogleSignInConfigured } from "@/lib/auth";
import { requireAdmin } from "@/lib/authz";
import { getContent } from "@/lib/content";
import { prisma } from "@/lib/db";
import { emailConfig } from "@/lib/email";
import { smsConfig } from "@/lib/sms";
import { isBucketConfigured } from "@/lib/storage";

import { saveBanner } from "./actions";

type Params = { error?: string; ok?: string };

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<Params> }) {
  const admin = await requireAdmin("/admin");
  const params = await searchParams;
  const now = new Date();

  const [smsActive, emailActive, pending, newInquiries, submitted, livePromotions, content] = await Promise.all([
    prisma.subscriber.count({ where: { smsStatus: "ACTIVE" } }),
    prisma.subscriber.count({ where: { emailStatus: "ACTIVE" } }),
    prisma.subscriber.count({ where: { OR: [{ smsStatus: "PENDING" }, { emailStatus: "PENDING" }] } }),
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.project.count({ where: { status: "SUBMITTED" } }),
    prisma.promotion.count({
      where: {
        publishedAt: { not: null, lte: now },
        AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
    }),
    getContent(),
  ]);

  const sms = smsConfig();
  const email = emailConfig();
  const setup: Array<{ label: string; ok: boolean; missing: string[] }> = [
    { label: "Google sign-in", ok: isGoogleSignInConfigured(), missing: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] },
    { label: "Texts (Twilio)", ok: sms.ok, missing: sms.ok ? [] : sms.missing },
    { label: "Email (Resend)", ok: email.ok, missing: email.ok ? [] : email.missing },
    { label: "File bucket", ok: isBucketConfigured(), missing: ["BUCKET_ENDPOINT", "BUCKET_NAME", "BUCKET_ACCESS_KEY_ID", "BUCKET_SECRET_ACCESS_KEY"] },
  ];

  return (
    <>
      <PageHeader title="Dashboard">
        <p className="m-0 text-[15px] text-muted">Signed in as {admin.name === admin.email ? admin.email : `${admin.name} (${admin.email})`}.</p>
      </PageHeader>
      <Flash params={params} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Tile href="/admin/subscribers" label="Text subscribers" value={smsActive} tone="brand" />
        <Tile href="/admin/subscribers" label="Email subscribers" value={emailActive} />
        <Tile href="/admin/subscribers?status=PENDING" label="Waiting to confirm" value={pending} />
        <Tile href="/admin/inquiries?status=NEW" label="New inquiries" value={newInquiries} />
        <Tile href="/admin/projects?status=SUBMITTED" label="Projects to review" value={submitted} />
        <Tile href="/admin/promotions" label="Live promotions" value={livePromotions} />
      </div>

      <Card title="Quick actions" className="mt-5">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <ButtonLink href="/admin/promotions/new">New promotion</ButtonLink>
          <ButtonLink href="/admin/catalog/new" variant="ink">
            Add a deal
          </ButtonLink>
          <ButtonLink href="/admin/projects?status=SUBMITTED" variant="outline">
            Review submissions
          </ButtonLink>
          <ButtonLink href="/admin/subscribers#add" variant="outline">
            Add a subscriber
          </ButtonLink>
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card title="Announcement bar">
          <form action={saveBanner} className="flex flex-col gap-3">
            <Field label="Text" hint="One line at the top of every page. Leave blank to hide it.">
              <Input name="banner" defaultValue={content["site.banner"]} maxLength={200} placeholder="Closed Saturday 11/18 · Milwaukee Days Friday 8am–12pm" />
            </Field>
            <Field label="Link (optional)" hint="Where the bar goes when tapped, like /promotions/milwaukee-days">
              <Input name="bannerLink" defaultValue={content["site.bannerLink"]} maxLength={300} placeholder="/promotions/…" inputMode="url" />
            </Field>
            <SubmitButton>Update bar</SubmitButton>
          </form>
        </Card>

        <Card title="Setup status">
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {setup.map((item) => (
              <li key={item.label} className="flex flex-wrap items-start justify-between gap-2 rounded border border-line px-3 py-2.5">
                <span className="font-semibold">{item.label}</span>
                {item.ok ? (
                  <Pill tone="green">ready</Pill>
                ) : (
                  <span className="text-right">
                    <Pill tone="yellow">not set</Pill>
                    <span className="mt-1 block text-[12px] text-muted">Missing: {item.missing.join(", ")}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="mb-0 mt-3 text-[13px] text-muted">Until texts or email are set up, &quot;Send alert&quot; records the message but nothing goes out. Uploads without a bucket are kept on the server disk.</p>
        </Card>
      </div>
    </>
  );
}
