import type { Metadata } from "next";

import { ButtonLink, Heading, Section } from "@/components/ui";
import { confirmEmailByToken } from "@/lib/subscribers";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Confirm Email Alerts",
  description: "Turn on your West Building Center email deal alerts.",
  robots: { index: false },
};

type Props = { searchParams: Promise<{ token?: string | string[] }> };

export default async function ConfirmPage({ searchParams }: Props) {
  const { token: raw } = await searchParams;
  const token = Array.isArray(raw) ? raw[0] : raw;
  const subscriber = token ? await confirmEmailByToken(token) : null;

  return (
    <Section>
      <div className="mx-auto max-w-[560px] text-center">
        {subscriber ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf6ed] text-[#14532d]">
              <svg aria-hidden width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <Heading as="h1" size="lg" className="mt-5">
              Your email alerts are on
            </Heading>
            <p className="mt-3 text-[17px]">
              We&apos;ll email <strong>{subscriber.email}</strong> when the next flyer or event lands. Every email has an unsubscribe link.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <ButtonLink href="/promotions">See current deals</ButtonLink>
              <ButtonLink href="/" variant="outline">
                Back home
              </ButtonLink>
            </div>
          </>
        ) : (
          <>
            <Heading as="h1" size="lg">
              That link isn&apos;t valid
            </Heading>
            <p className="mt-3 text-[17px]">It may have been copied wrong, or it belongs to a sign-up that was removed. Signing up again takes ten seconds.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <ButtonLink href="/alerts">Sign up for alerts</ButtonLink>
              <ButtonLink href={SITE.phoneHref} variant="outline">
                Call {SITE.phoneDisplay}
              </ButtonLink>
            </div>
          </>
        )}
      </div>
    </Section>
  );
}
