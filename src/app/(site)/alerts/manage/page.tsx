import type { Metadata } from "next";
import Link from "next/link";

import { ManageAlertsForm } from "@/app/(site)/alerts/manage/ManageAlertsForm";
import { ButtonLink, Eyebrow, Heading, Section } from "@/components/ui";
import { formatUsPhone } from "@/lib/phone";
import { SITE } from "@/lib/site";
import { findByToken } from "@/lib/subscribers";

export const metadata: Metadata = {
  title: "Manage Deal Alerts",
  description: "Stop or change your West Building Center text and email deal alerts.",
  robots: { index: false },
};

/** "(660) 555-0123" → "(660) ***-0123": enough to recognize, not enough to leak. */
function maskPhone(e164: string): string {
  return formatUsPhone(e164).replace(/\) \d{3}-/, ") ***-");
}

type Props = { searchParams: Promise<{ token?: string | string[] }> };

export default async function ManagePage({ searchParams }: Props) {
  const { token: raw } = await searchParams;
  const token = Array.isArray(raw) ? raw[0] : raw;
  const subscriber = token ? await findByToken(token) : null;

  return (
    <Section>
      <div className="mx-auto max-w-[560px]">
        <Eyebrow className="text-brand">Deal alerts</Eyebrow>
        <Heading as="h1" size="lg" className="mt-2">
          Manage your alerts
        </Heading>

        {subscriber ? (
          <>
            <p className="mt-3 text-[17px]">
              {subscriber.name ? `Hi ${subscriber.name.split(" ")[0]}. ` : ""}Here&apos;s what we have for you. Tick what you want to stop.
            </p>
            <div className="mt-5">
              <ManageAlertsForm
                token={subscriber.manageToken}
                phoneMasked={subscriber.phone ? maskPhone(subscriber.phone) : null}
                email={subscriber.email}
                smsActive={subscriber.smsStatus === "ACTIVE" || subscriber.smsStatus === "PENDING"}
                emailActive={subscriber.emailStatus === "ACTIVE" || subscriber.emailStatus === "PENDING"}
              />
            </div>
          </>
        ) : (
          <>
            {token ? (
              <p className="mt-3 rounded border border-[#f3b8c0] bg-[#fdecef] px-4 py-3 text-sm font-medium text-brand-dark" role="alert">
                That link isn&apos;t valid. It may have been copied wrong, or the sign-up was removed.
              </p>
            ) : null}
            <p className="mt-3 text-[17px]">Stopping is easy, and you don&apos;t need to sign in. Pick whichever is handiest:</p>
            <ul className="mt-4 flex flex-col gap-3 text-[17px]">
              <li className="rounded-md bg-paper p-4">
                <strong>Texts:</strong> reply <strong>STOP</strong> to any text from us. That&apos;s it.
              </li>
              <li className="rounded-md bg-paper p-4">
                <strong>Emails:</strong> click <strong>Unsubscribe</strong> at the bottom of any email. Every one has a personal manage link too, which brings you back here with your options showing.
              </li>
              <li className="rounded-md bg-paper p-4">
                <strong>Or just call:</strong>{" "}
                <a href={SITE.phoneHref} className="font-bold text-brand underline">
                  {SITE.phoneDisplay}
                </a>{" "}
                and we&apos;ll take you off by hand.
              </li>
            </ul>
            <p className="mt-4 text-[15px] text-muted">We don&apos;t look up accounts by phone or email on this page, so nobody else can change your alerts.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/alerts">Sign up for alerts</ButtonLink>
              <ButtonLink href="/" variant="outline">
                Back home
              </ButtonLink>
            </div>
          </>
        )}

        <p className="mt-8 text-[13px] text-muted">
          <Link href="/sms-terms" className="underline">
            SMS terms
          </Link>{" "}
          ·{" "}
          <Link href="/privacy" className="underline">
            Privacy
          </Link>
        </p>
      </div>
    </Section>
  );
}
