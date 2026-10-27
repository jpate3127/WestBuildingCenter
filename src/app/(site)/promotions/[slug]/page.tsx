import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MediaImage } from "@/components/MediaImage";
import { Band, CallLabel, Prose, VisitCard } from "@/components/site/blocks";
import { PickCard, promotionPdfHref } from "@/components/site/cards";
import { Badge, ButtonLink, Container, Heading, PhoneIcon } from "@/components/ui";
import { getContent } from "@/lib/content";
import { fmtDateRange, fmtEventWhen, isActive } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { getPromotionBySlug } from "@/lib/queries";
import { SITE } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const promotion = await getPromotionBySlug(slug);
  if (!promotion) return { title: "Promotion not found" };
  const description = promotion.summary ?? `${promotion.brand ? `${promotion.brand} ` : ""}${promotion.kind === "EVENT" ? "event" : "deals"} at ${SITE.name}, ${SITE.address.city}, MO.`;
  return {
    title: promotion.title,
    description,
    openGraph: {
      title: promotion.title,
      description,
      ...(promotion.imageKey ? { images: [{ url: mediaUrl(promotion.imageKey), alt: `${promotion.title} flyer` }] } : {}),
    },
  };
}

export default async function PromotionPage({ params }: Props) {
  const { slug } = await params;
  const [promotion, content] = await Promise.all([getPromotionBySlug(slug), getContent()]);
  if (!promotion) notFound();

  const isEvent = promotion.kind === "EVENT";
  const when = isEvent ? fmtEventWhen(promotion.startsAt, promotion.endsAt) : fmtDateRange(promotion.startsAt, promotion.endsAt);
  const ended = Boolean(promotion.endsAt && !isActive(new Date(), null, promotion.endsAt));
  const pdfHref = promotionPdfHref(promotion);
  const items = promotion.catalogItems;

  return (
    <>
      {/* Red header band: what, when, one line of why. */}
      <section className="bg-brand text-white">
        <Container className="py-8 sm:py-12">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="white">{isEvent ? "Event" : (promotion.brand ?? "Promo")}</Badge>
            {ended ? <Badge>Ended</Badge> : null}
          </div>
          <Heading as="h1" size="lg" className="mt-3">
            {promotion.title}
          </Heading>
          {when ? <p className="mt-3 text-[18px] font-bold sm:text-[20px]">{when}</p> : null}
          {promotion.summary ? <p className="mt-2 max-w-[640px] text-[17px] sm:text-[19px]">{promotion.summary}</p> : null}
        </Container>
      </section>

      <Band className="py-6 sm:py-10">
        <div className="mx-auto flex max-w-[760px] flex-col gap-6">
          {/* The flyer itself, tap to open the PDF. */}
          {promotion.imageKey ? (
            pdfHref ? (
              <a href={pdfHref} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border border-line shadow-[0_10px_28px_rgba(0,0,0,0.14)]" aria-label="Open the full flyer (PDF)">
                <MediaImage imageKey={promotion.imageKey} alt={`${promotion.title} flyer`} className="w-full" loading="eager" />
              </a>
            ) : (
              <MediaImage imageKey={promotion.imageKey} alt={`${promotion.title} flyer`} className="w-full overflow-hidden rounded-md border border-line" loading="eager" />
            )
          ) : null}

          <div className="flex flex-col gap-3">
            <ButtonLink href={SITE.phoneHref} className="display min-h-14 text-[22px] tracking-wide">
              <PhoneIcon className="h-5 w-5 shrink-0" /> <CallLabel label="Call to hold one" />
            </ButtonLink>
            {pdfHref ? (
              <ButtonLink href={pdfHref} target="_blank" rel="noreferrer" variant="outline">
                Download PDF
              </ButtonLink>
            ) : null}
            <ButtonLink href={SITE.mapsUrl} target="_blank" rel="noreferrer" variant="outline">
              Directions
            </ButtonLink>
          </div>

          <Prose text={promotion.body} />

          {items.length ? (
            <div>
              <Heading size="md">Deals in this flyer</Heading>
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-4">
                {items.map((item) => (
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
            </div>
          ) : null}

          <VisitCard hours={content["store.hours"]} directions={content["store.directions"]} delivery={content["store.delivery"]} />

          <div className="flex flex-col gap-3 text-[15px]">
            <Link href="/promotions" className="font-bold text-brand">
              Past promotions →
            </Link>
            <p className="m-0 text-muted">
              You&apos;re getting these texts because you signed up for {SITE.name} deal alerts.{" "}
              <Link href="/alerts/manage" className="underline">
                Manage alerts
              </Link>{" "}
              or reply STOP to any text.
            </p>
          </div>
        </div>
      </Band>
    </>
  );
}
