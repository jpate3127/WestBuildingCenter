import type { Metadata } from "next";
import Link from "next/link";

import { AlertSignupForm } from "@/components/site/AlertSignupForm";
import { Band } from "@/components/site/blocks";
import { CheckIcon, Container, Eyebrow, Heading } from "@/components/ui";
import { getContent } from "@/lib/content";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Deal Alerts by Text or Email",
  description: "Get a text or email when the new Milwaukee flyer drops or an event is coming up at West Building Center. About 2–4 messages a month. Reply STOP anytime.",
};

export default async function AlertsPage() {
  const content = await getContent();
  return (
    <>
      <section className="bg-brand text-white">
        <Container className="py-10 text-center sm:py-14">
          <Eyebrow className="text-white/90">{content["home.eyebrow"]}</Eyebrow>
          <Heading as="h1" size="lg" className="mt-2">
            Deal alerts by text or email
          </Heading>
          <p className="mx-auto mt-4 max-w-[600px] text-[17px] sm:text-[19px]">{content["home.subhead"]}</p>
        </Container>
      </section>

      <Band className="py-8 sm:py-12">
        <div className="mx-auto grid max-w-[960px] gap-8 lg:grid-cols-[1fr_320px] lg:gap-12">
          <div className="rounded-md border border-line bg-white p-4 sm:p-6">
            <AlertSignupForm variant="card" showName showEmail consentText={content["alerts.consent"]} frequencyText={content["alerts.frequency"]} />
          </div>
          <aside className="flex flex-col gap-5 text-[16px]">
            <div>
              <Heading size="sm">What you get</Heading>
              <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
                {["The new Milwaukee flyer the day it drops", "Milwaukee Days, giveaways and sales events", "Hunting blind arrivals in season"].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckIcon className="mt-1 shrink-0 text-brand" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Heading size="sm">How often</Heading>
              <p className="mt-2 text-muted">About 2–4 messages a month. {content["alerts.frequency"]}. No daily blasts.</p>
            </div>
            <div>
              <Heading size="sm">How to stop</Heading>
              <p className="mt-2 text-muted">
                Reply <strong>STOP</strong> to any text, click unsubscribe in any email, or call {SITE.phoneDisplay}. Done.
              </p>
            </div>
            <p className="m-0 text-[15px]">
              Already signed up?{" "}
              <Link href="/alerts/manage" className="font-semibold text-brand underline">
                Manage your alerts
              </Link>
            </p>
          </aside>
        </div>
      </Band>
    </>
  );
}
