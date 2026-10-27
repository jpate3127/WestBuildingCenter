import type { Metadata } from "next";

import { EstimateForm } from "@/app/(site)/projects/estimate/EstimateForm";
import { PageHeader } from "@/components/site/blocks";
import { ButtonLink, CheckIcon, Heading, PhoneIcon, Section } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Start a Project Estimate",
  description: "Send West Building Center your plans or describe the job. We'll build the materials list, price it and call you back within a business day.",
};

const STEPS = [
  ["You send it", "Plans, a sketch or a description. Photos help."],
  ["We build the list", "Every board, sheet, window and box of nails, priced."],
  ["We call you", "Usually within a business day. We go over it together and adjust."],
  ["You say go", "We order what we don't stock and deliver it to your site."],
];

export default function EstimatePage() {
  return (
    <>
      <PageHeader eyebrow="Projects & building" title="Start a project estimate" text="No appointment, no big-box runaround. Tell us what you're building and we'll figure the materials with you." tone="cream" />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
          <div className="rounded-md border border-line bg-white p-4 sm:p-6">
            <EstimateForm />
          </div>
          <aside className="flex flex-col gap-6">
            <div>
              <Heading size="sm">What happens next</Heading>
              <ol className="m-0 mt-3 flex list-none flex-col gap-3 p-0">
                {STEPS.map(([title, sub], i) => (
                  <li key={title} className="flex items-start gap-3">
                    <span className="display flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-[18px] text-cream-dark">{i + 1}</span>
                    <span>
                      <strong>{title}</strong>
                      <br />
                      <span className="text-[15px] text-muted">{sub}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[15px] font-semibold">
              <li className="flex items-center gap-2">
                <CheckIcon className="text-brand" /> Free, no obligation
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="text-brand" /> Special orders in 2–5 days
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="text-brand" /> Delivery to your site
              </li>
            </ul>
            <div className="rounded-md bg-paper p-4">
              <p className="m-0 font-semibold">Rather talk it through?</p>
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
