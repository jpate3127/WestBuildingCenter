import type { Metadata } from "next";

import { MediaImage } from "@/components/MediaImage";
import { Prose, VisitCard } from "@/components/site/blocks";
import { ButtonLink, CheckIcon, Eyebrow, Heading, Section } from "@/components/ui";
import { getContent } from "@/lib/content";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About · Family-Owned Since 2014",
  description: "West Building Center is a family-owned lumber yard and hardware store in Atlanta, Missouri. Our story, what makes us different, and how we show up for the community.",
};

const DIFFERENT = [
  ["Someone you know answers the phone", "No menu, no hold music. Ask for the counter and you've got a person who knows your project."],
  ["We figure the materials with you", "Bring plans or a sketch. We build the list, price it and special-order what we don't stock."],
  ["We deliver to your site", "Farm, lot or driveway. Lumber, trusses, windows, cabinets."],
  ["Milwaukee, with the deals", "A real Milwaukee dealer with the monthly flyer, and we'll text you when it drops."],
  ["Honest about stock", "If we don't have it, we'll say so and tell you when it's in."],
];

export default async function AboutPage() {
  const content = await getContent();
  return (
    <>
      <Section tone="cream">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
          <div className="lg:w-1/2">
            <Eyebrow className="text-cream-dark">Family-owned since 2014</Eyebrow>
            <Heading as="h1" size="lg" className="mt-2">
              Our story
            </Heading>
            <Prose text={content["about.story"]} className="mt-5" />
          </div>
          <figure className="m-0 overflow-hidden rounded-lg shadow-[0_12px_30px_rgba(60,40,20,0.18)] lg:w-1/2">
            <MediaImage imageKey={null} alt="The West Building Center team" className="h-60 w-full object-cover sm:h-80 lg:h-[420px]" fallback="Team photo coming" />
          </figure>
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <Eyebrow className="text-brand">Why people drive past the big box</Eyebrow>
            <Heading size="md" className="mt-1">
              What makes us different
            </Heading>
            <ul className="m-0 mt-5 flex list-none flex-col gap-4 p-0">
              {DIFFERENT.map(([title, text]) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper text-brand">
                    <CheckIcon />
                  </span>
                  <span>
                    <strong>{title}</strong>
                    <br />
                    <span className="text-[15px] text-muted">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-md bg-ink p-5 text-white sm:p-6">
              <Eyebrow className="text-brand-tint">Community</Eyebrow>
              <p className="mt-2 text-[17px]">
                We&apos;re the sign on the 4-H banner, the sponsor at the Booster Club tournament, and the truck that shows up when the school needs a load of lumber for the float. This is home.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/projects">See local projects</ButtonLink>
              <ButtonLink href="/contact" variant="outline">
                Get in touch
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="paper">
        <Heading size="md">Come see us</Heading>
        <VisitCard className="mt-5" hours={content["store.hours"]} directions={content["store.directions"]} delivery={content["store.delivery"]} email={content["store.email"]} />
        <p className="mt-4 text-[15px] text-muted">
          Questions? Call{" "}
          <a href={SITE.phoneHref} className="font-bold text-ink underline">
            {SITE.phoneDisplay}
          </a>
          .
        </p>
      </Section>
    </>
  );
}
