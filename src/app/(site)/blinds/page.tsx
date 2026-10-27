import type { Metadata } from "next";

import { Band, CallBlock, SectionLead } from "@/components/site/blocks";
import { BlindCard, PickCard } from "@/components/site/cards";
import { ButtonLink, Container, Eyebrow, Heading, Section } from "@/components/ui";
import { getContent } from "@/lib/content";
import { getCatalogByCategory } from "@/lib/queries";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Muddy & Hawk Hunting Blinds",
  description: "Muddy and Hawk box blinds on 5 ft and 10 ft towers, in stock at West Building Center in Atlanta, MO. Installation available. Tactacam cameras too.",
};

const FAQ = [
  ["Do you install?", "Yes. We'll set the tower and blind on your spot. Ask for an install price when you call."],
  ["What towers do you have?", "5 ft and 10 ft towers, matched to the blind. We'll help you pick based on your terrain."],
  ["Can I see one first?", "Come climb into the display model on our lot. Bring the kids; they love it."],
  ["Financing?", "Ask us. We'll work something out with you."],
  ["Can I reserve one?", "Call and we'll hold it with a deposit, or pre-order a model we're out of."],
];

export default async function BlindsPage() {
  const [content, blinds, outdoor] = await Promise.all([getContent(), getCatalogByCategory("BLIND"), getCatalogByCategory("OUTDOOR")]);

  return (
    <>
      <section className="bg-ink text-white">
        <Container className="py-10 sm:py-14">
          <Eyebrow className="text-brand-tint">In stock · We install</Eyebrow>
          <Heading as="h1" size="lg" className="mt-2">
            {content["home.blindsHeadline"]}
          </Heading>
          <p className="mt-4 max-w-[640px] text-[17px] text-[#cfcfcf] sm:text-[19px]">
            Box blinds on 5 ft and 10 ft towers, sitting on our lot right now. {content["home.blindsText"]}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={SITE.phoneHref}>Call to reserve</ButtonLink>
            <ButtonLink href={SITE.mapsUrl} target="_blank" rel="noreferrer" variant="outline-white">
              Come see them
            </ButtonLink>
          </div>
        </Container>
      </section>

      <Band tone="ink" className="pb-12 sm:pb-16 lg:pb-20">
        {blinds.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {blinds.map((item) => (
              <BlindCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-md bg-ink-2 p-5 text-[17px] text-[#cfcfcf]">
            <p className="m-0">
              We&apos;re between shipments. <strong className="text-white">Call us</strong> and we&apos;ll tell you what&apos;s coming and when, or pre-order the one you want.
            </p>
          </div>
        )}
      </Band>

      {outdoor.length ? (
        <Section tone="paper">
          <SectionLead eyebrow="Also in stock" title="Cameras & accessories" text="Tactacam cellular cameras, grills and the rest of the outdoor wall." />
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-3">
            {outdoor.map((item) => (
              <div key={item.id}>
                <div className="sm:hidden">
                  <PickCard item={{ ...item, promotion: null }} compact />
                </div>
                <div className="hidden sm:block">
                  <PickCard item={{ ...item, promotion: null }} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      <Section>
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
          <CallBlock title="Call to reserve or pre-order" text="Blinds go fast in the fall. A quick call holds one for you, or gets your name on the next truck." label="Call" />
          <div>
            <Heading size="md">Good to know</Heading>
            <dl className="mt-4 flex flex-col divide-y divide-line">
              {FAQ.map(([q, a]) => (
                <div key={q} className="py-3">
                  <dt className="font-bold">{q}</dt>
                  <dd className="m-0 mt-1 text-[16px] text-muted">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Section>
    </>
  );
}
