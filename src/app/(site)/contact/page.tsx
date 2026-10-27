import type { Metadata } from "next";

import { ContactForm } from "@/app/(site)/contact/ContactForm";
import { Band } from "@/components/site/blocks";
import { ButtonLink, Container, Eyebrow, Heading, OpenDot, PhoneIcon, PinIcon } from "@/components/ui";
import { getContent } from "@/lib/content";
import { isOpenNow } from "@/lib/hours";
import { ADDRESS_LINE, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & Hours",
  description: `Visit West Building Center at ${ADDRESS_LINE}. Hours, phone, directions and a contact form.`,
};

const MAP_EMBED = "https://www.google.com/maps?q=206+W+Main+St,+Atlanta,+MO+63530&output=embed";

export default async function ContactPage() {
  const content = await getContent();
  const open = isOpenNow(content["store.hours"]);
  const email = content["store.email"].trim();

  return (
    <>
      <section className="bg-paper text-ink">
        <Container className="py-10 sm:py-14">
          <Eyebrow className="text-brand">Visit · Call · Write</Eyebrow>
          <Heading as="h1" size="lg" className="mt-2">
            Contact us
          </Heading>
          <a href={SITE.phoneHref} className="display mt-5 inline-flex items-center gap-3 text-[40px] text-ink sm:text-[52px]">
            <PhoneIcon className="h-8 w-8 text-brand" /> {SITE.phoneDisplay}
          </a>
          <p className="mt-1 flex items-center gap-2 text-[15px] font-semibold text-muted">
            <OpenDot open={open} /> {open ? "Open now" : "Closed now"} · {content["store.hoursShort"]}
          </p>
        </Container>
      </section>

      <Band className="py-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="flex flex-col gap-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Heading as="h2" size="sm">
                  Hours
                </Heading>
                <p className="mt-2 whitespace-pre-line text-[17px]">{content["store.hours"]}</p>
                <p className="mt-2 font-bold">{content["store.delivery"]}</p>
              </div>
              <div>
                <Heading as="h2" size="sm">
                  Address
                </Heading>
                <p className="mt-2 text-[17px]">
                  <strong>{SITE.address.street}</strong>
                  <br />
                  {SITE.address.city}, {SITE.address.state} {SITE.address.zip}
                  <br />
                  <span className="text-muted">{content["store.directions"]}</span>
                </p>
                <ButtonLink href={SITE.mapsUrl} target="_blank" rel="noreferrer" variant="ink" className="mt-3 w-full sm:w-auto">
                  <PinIcon /> Directions
                </ButtonLink>
              </div>
            </div>
            {email ? (
              <p className="m-0 text-[17px]">
                Email:{" "}
                <a href={`mailto:${email}`} className="font-bold text-brand underline">
                  {email}
                </a>
              </p>
            ) : null}
            <iframe src={MAP_EMBED} title="Map" loading="lazy" height={260} className="w-full rounded-md border border-line" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
          </div>

          <div>
            <Heading as="h2" size="md">
              Send us a note
            </Heading>
            <p className="mt-2 text-muted">Stock questions, special orders, a price check. We answer within a business day.</p>
            <div className="mt-5 rounded-md border border-line bg-white p-4 sm:p-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </Band>
    </>
  );
}
