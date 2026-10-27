import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BackLink, Band, CallLabel, ImageStack, Prose } from "@/components/site/blocks";
import { Badge, ButtonLink, Container, Eyebrow, Heading, PhoneIcon } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { CATALOG_CATEGORY_LABELS } from "@/lib/labels";
import { mediaUrl } from "@/lib/media";
import { getCatalogItemBySlug } from "@/lib/queries";
import { SITE } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getCatalogItemBySlug(slug);
  if (!item) return { title: "Item not found" };
  const description = `${item.name}, ${formatMoney(item.priceCents, item.priceNote)} at ${SITE.name} in ${SITE.address.city}, MO.`;
  return {
    title: item.name,
    description,
    openGraph: { title: item.name, description, ...(item.imageKeys[0] ? { images: [{ url: mediaUrl(item.imageKeys[0]), alt: item.name }] } : {}) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const item = await getCatalogItemBySlug(slug);
  if (!item) notFound();
  const backHref = item.category === "BLIND" ? "/blinds" : "/products";
  const promo = item.promotion;

  return (
    <>
      <Container className="py-4">
        <BackLink href={backHref}>{item.category === "BLIND" ? "All blinds" : "What we carry"}</BackLink>
      </Container>

      <Band className="pb-12 sm:pb-16 lg:pb-20">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
          <ImageStack keys={item.imageKeys} alt={item.name} />
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Eyebrow className="text-brand">{item.brand ?? CATALOG_CATEGORY_LABELS[item.category]}</Eyebrow>
              {item.badge ? <Badge>{item.badge}</Badge> : null}
            </div>
            <Heading as="h1" size="lg">
              {item.name}
            </Heading>
            <div className="display text-[44px] text-brand sm:text-[52px]">{formatMoney(item.priceCents, item.priceNote)}</div>
            {item.stockNote ? <p className="m-0 text-[17px] font-bold">{item.stockNote}</p> : null}

            {promo ? (
              <div className="rounded-md border border-line bg-paper p-4">
                <div className="text-[15px] text-muted">Part of</div>
                <Link href={`/promotions/${promo.slug}`} className="text-[18px] font-bold text-brand">
                  {promo.title} →
                </Link>
                {promo.pdfKey ? (
                  <ButtonLink href={mediaUrl(promo.pdfKey)} target="_blank" rel="noreferrer" variant="outline" className="mt-3 w-full sm:w-auto">
                    Open the flyer (PDF)
                  </ButtonLink>
                ) : null}
              </div>
            ) : null}

            <Prose text={item.description} />

            <div className="mt-2 flex flex-col gap-3">
              <ButtonLink href={SITE.phoneHref} className="display min-h-14 text-[22px] tracking-wide">
                <PhoneIcon className="h-5 w-5 shrink-0" /> <CallLabel label="Call to hold one" />
              </ButtonLink>
              <ButtonLink href={SITE.mapsUrl} target="_blank" rel="noreferrer" variant="outline">
                Directions
              </ButtonLink>
            </div>
            <p className="m-0 text-[15px] text-muted">Prices are in-store and can change with the flyer. Call to check stock before you drive.</p>
          </div>
        </div>
      </Band>
    </>
  );
}
