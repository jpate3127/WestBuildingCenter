import type { Metadata } from "next";

import { AccountForm, QuoteForm } from "@/app/(site)/business/BusinessForms";
import { Band } from "@/components/site/blocks";
import { ButtonLink, Container, Eyebrow, Heading, PhoneIcon, Section } from "@/components/ui";
import { getContent } from "@/lib/content";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "For Businesses · Tool & Supply Quotes",
  description: "Contractors, shops and plants: competitive pricing on drill bits, blades, abrasives, fasteners and Milwaukee tools. Paste your list for a same-day quote, or open a business account.",
};

const BENEFITS = [
  ["Competitive pricing", "Bits, blades, abrasives, fasteners and Milwaukee, often under catalog-supplier prices. No minimums, no freight surprises."],
  ["Same-day quotes", "Send the list in the morning and you'll usually have numbers before you leave the shop."],
  ["Delivery or will-call", "We'll run it out to the job or the plant, or have it bagged at the counter with your name on it."],
];

export default async function BusinessPage() {
  const content = await getContent();
  return (
    <>
      <section className="bg-ink text-white">
        <Container className="py-10 sm:py-14">
          <Eyebrow className="text-brand-tint">For contractors, shops &amp; plants</Eyebrow>
          <Heading as="h1" size="lg" className="mt-2">
            {content["business.headline"]}
          </Heading>
          <p className="mt-4 max-w-[640px] text-[17px] text-[#cfcfcf] sm:text-[19px]">{content["business.text"]}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="#quote">Request a quote</ButtonLink>
            <ButtonLink href={SITE.phoneHref} variant="outline-white">
              <PhoneIcon /> {SITE.phoneDisplay}
            </ButtonLink>
          </div>
        </Container>
      </section>

      <Band tone="paper" className="py-8 sm:py-10">
        <div className="grid gap-3 sm:grid-cols-3">
          {BENEFITS.map(([title, text]) => (
            <div key={title} className="rounded-md bg-white p-5">
              <div className="h-1 w-10 bg-brand" />
              <h2 className="display m-0 mt-3 text-[24px]">{title}</h2>
              <p className="mt-2 text-[15px] text-muted">{text}</p>
            </div>
          ))}
        </div>
      </Band>

      <Section id="quote">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
          <div>
            <Eyebrow className="text-brand">Request a quote</Eyebrow>
            <Heading size="md" className="mt-1">
              Paste your list. We&apos;ll price it.
            </Heading>
            <p className="mt-2 text-muted">Part numbers, a catalog screenshot typed out, or plain English. We&apos;ll match brands where it saves you money and tell you when it doesn&apos;t.</p>
            <div className="mt-6 rounded-md border border-line bg-white p-4 sm:p-6">
              <QuoteForm />
            </div>
          </div>
          <aside className="flex flex-col gap-6">
            <div id="account" className="rounded-md bg-paper p-5 sm:p-6">
              <Eyebrow className="text-brand">Buy on account</Eyebrow>
              <Heading size="sm" className="mt-1">
                Open a business account
              </Heading>
              <p className="mt-2 text-[15px] text-muted">One monthly statement, authorized buyers on file, and your crew can pick up without a card.</p>
              <div className="mt-4">
                <AccountForm />
              </div>
            </div>
            <div className="rounded-md border border-line p-5">
              <p className="m-0 font-semibold">Rather talk to a person?</p>
              <p className="mt-1 text-[15px] text-muted">Ask for the counter. We quote over the phone all day.</p>
              <ButtonLink href={SITE.phoneHref} variant="ink" className="mt-3 w-full">
                <PhoneIcon /> {SITE.phoneDisplay}
              </ButtonLink>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
