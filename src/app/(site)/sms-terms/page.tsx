import type { Metadata } from "next";
import Link from "next/link";

import { Eyebrow, Heading, Section } from "@/components/ui";
import { getContent } from "@/lib/content";
import { ADDRESS_LINE, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "SMS Terms · Deal Alerts",
  description: "Terms for the West Building Center Deal Alerts text program: what you get, how often, how to opt out, and how to get help.",
};

const PROGRAM = "West Building Center Deal Alerts";

function H({ children }: { children: React.ReactNode }) {
  return (
    <Heading as="h2" size="sm" className="mt-8">
      {children}
    </Heading>
  );
}

export default async function SmsTermsPage() {
  const content = await getContent();
  const email = content["store.email"].trim();
  return (
    <Section>
      <article className="mx-auto max-w-[720px] text-[17px] leading-relaxed [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
        <Eyebrow className="text-brand">Text messaging</Eyebrow>
        <Heading as="h1" size="lg" className="mt-2">
          SMS terms
        </Heading>
        <p className="text-muted">Program: {PROGRAM}</p>

        <H>What the program is</H>
        <p>
          {PROGRAM} sends text messages from {SITE.name} about Milwaukee tool promotions, flyers, sales events like Milwaukee Days, giveaways, and seasonal arrivals such as hunting blinds. Each message links to the details on this site.
        </p>

        <H>How you join</H>
        <p>
          You join by entering your mobile number on this website and agreeing to the consent statement, or by asking us at the counter or on the phone. Either way we send a confirmation text and your alerts only start after you reply <strong>YES</strong>.
        </p>
        <p className="rounded-md bg-paper p-4 text-[16px]">{content["alerts.consent"]}</p>

        <H>Message frequency</H>
        <p>Recurring messages, about 2–4 per month. Frequency varies with how many promotions and events we have.</p>

        <H>Cost</H>
        <p>
          <strong>Msg &amp; data rates may apply.</strong> We don&apos;t charge for the program; your carrier may charge for text messages under your plan.
        </p>

        <H>How to opt out</H>
        <p>
          Text <strong>STOP</strong> to any message from us at any time. You&apos;ll get one confirmation text and nothing more. To rejoin, text <strong>START</strong> or sign up again at{" "}
          <Link href="/alerts" className="font-semibold text-brand underline">
            /alerts
          </Link>
          .
        </p>

        <H>Help</H>
        <p>
          Text <strong>HELP</strong> to any message, call{" "}
          <a href={SITE.phoneHref} className="font-semibold text-brand underline">
            {SITE.phoneDisplay}
          </a>
          {email ? (
            <>
              , or email{" "}
              <a href={`mailto:${email}`} className="font-semibold text-brand underline">
                {email}
              </a>
            </>
          ) : null}
          .
        </p>

        <H>Carriers</H>
        <p>Supported carriers include AT&amp;T, T-Mobile, Verizon, US Cellular and most regional carriers. Carriers are not liable for delayed or undelivered messages.</p>

        <H>Privacy</H>
        <p>
          We never sell or share your mobile number, and no mobile information is shared with third parties or affiliates for marketing or promotional purposes. The full details are in our{" "}
          <Link href="/privacy" className="font-semibold text-brand underline">
            privacy policy
          </Link>
          .
        </p>

        <H>Who we are</H>
        <p>
          {SITE.name}
          <br />
          {ADDRESS_LINE}
          <br />
          <a href={SITE.phoneHref} className="font-semibold text-brand underline">
            {SITE.phoneDisplay}
          </a>
        </p>
      </article>
    </Section>
  );
}
