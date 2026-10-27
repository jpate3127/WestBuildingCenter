import type { Metadata } from "next";

import { UnsubscribeForm } from "@/app/(site)/alerts/unsubscribe/UnsubscribeForm";
import { ButtonLink, Eyebrow, Heading, Section } from "@/components/ui";
import { SITE } from "@/lib/site";
import { findByToken } from "@/lib/subscribers";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Stop West Building Center deal alerts by text and email.",
  robots: { index: false },
};

type Props = { searchParams: Promise<{ token?: string | string[] }> };

/**
 * The link in every email (and the List-Unsubscribe target). A plain GET
 * shows one confirm button; the button's server action stops both channels.
 */
export default async function UnsubscribePage({ searchParams }: Props) {
  const { token: raw } = await searchParams;
  const token = Array.isArray(raw) ? raw[0] : raw;
  const subscriber = token ? await findByToken(token) : null;

  return (
    <Section>
      <div className="mx-auto max-w-[560px]">
        <Eyebrow className="text-brand">Deal alerts</Eyebrow>
        <Heading as="h1" size="lg" className="mt-2">
          Unsubscribe
        </Heading>
        {subscriber ? (
          <>
            <p className="mt-3 text-[17px]">This stops both texts and emails from {SITE.name}. One tap, no sign-in.</p>
            <div className="mt-5">
              <UnsubscribeForm token={subscriber.manageToken} />
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 text-[17px]">That link isn&apos;t valid. You can still stop alerts the easy way:</p>
            <ul className="mt-4 flex flex-col gap-3 text-[17px]">
              <li className="rounded-md bg-paper p-4">
                <strong>Texts:</strong> reply <strong>STOP</strong> to any text from us.
              </li>
              <li className="rounded-md bg-paper p-4">
                <strong>Emails:</strong> click Unsubscribe at the bottom of any email.
              </li>
              <li className="rounded-md bg-paper p-4">
                <strong>Or call</strong>{" "}
                <a href={SITE.phoneHref} className="font-bold text-brand underline">
                  {SITE.phoneDisplay}
                </a>
                .
              </li>
            </ul>
            <ButtonLink href="/" variant="outline" className="mt-6">
              Back home
            </ButtonLink>
          </>
        )}
      </div>
    </Section>
  );
}
