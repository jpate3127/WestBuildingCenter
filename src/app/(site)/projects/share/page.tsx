import type { Metadata } from "next";

import { ShareProjectForm } from "@/app/(site)/projects/share/ShareProjectForm";
import { PageHeader } from "@/components/site/blocks";
import { Heading, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Share Your Project",
  description: "Built something with materials from West Building Center? Send us a photo and we'll feature it in the Built with WBC gallery.",
};

export default function SharePage() {
  return (
    <>
      <PageHeader eyebrow="Built with West Building Center" title="Share your project" text="Bought your materials here? Send us a photo of the finished job and we'll put it in the gallery for the neighbors to see." tone="cream" />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
          <div className="rounded-md border border-line bg-white p-4 sm:p-6">
            <ShareProjectForm />
          </div>
          <aside className="flex flex-col gap-5 text-[16px]">
            <div>
              <Heading size="sm">What makes a good photo</Heading>
              <ul className="mt-3 list-disc pl-5 text-muted">
                <li>Step back and get the whole thing in the frame.</li>
                <li>Daylight beats a flash.</li>
                <li>A before-and-after pair is gold.</li>
                <li>Landscape (sideways) photos fit the gallery best.</li>
              </ul>
            </div>
            <div className="rounded-md bg-cream p-4 text-cream-ink">
              <p className="m-0">
                <strong>No pros required.</strong> Decks, sheds, a repainted porch, a finished shop. If our boards are in it, we want to see it.
              </p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
