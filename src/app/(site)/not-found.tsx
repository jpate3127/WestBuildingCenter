import type { Metadata } from "next";

import { ButtonLink, Eyebrow, Heading, PhoneIcon, Section } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Page not found",
  description: "That page isn't here. Head home, see the current deals, or give us a call.",
};

export default function NotFound() {
  return (
    <Section>
      <div className="mx-auto max-w-[560px] text-center">
        <Eyebrow className="text-brand">404</Eyebrow>
        <Heading as="h1" size="lg" className="mt-2">
          That aisle isn&apos;t here
        </Heading>
        <p className="mt-3 text-[17px]">The page moved, the flyer ended, or the link got typed wrong. Everything we have is a tap away.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink href="/">Go home</ButtonLink>
          <ButtonLink href="/promotions" variant="outline">
            Current deals
          </ButtonLink>
          <ButtonLink href={SITE.phoneHref} variant="outline">
            <PhoneIcon /> {SITE.phoneDisplay}
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
