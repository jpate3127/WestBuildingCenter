import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink, Band, CallLabel, ImageStack, Prose } from "@/components/site/blocks";
import { Badge, ButtonLink, Container, Eyebrow, Heading, PhoneIcon } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { getCatalogItemBySlug } from "@/lib/queries";
import { SITE } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getCatalogItemBySlug(slug);
  if (!item || item.category !== "BLIND") return { title: "Blind not found" };
  const description = `${item.name}, ${formatMoney(item.priceCents, item.priceNote)} at ${SITE.name} in ${SITE.address.city}, MO. In stock, installation available.`;
  return {
    title: item.name,
    description,
    openGraph: { title: item.name, description, ...(item.imageKeys[0] ? { images: [{ url: mediaUrl(item.imageKeys[0]), alt: item.name }] } : {}) },
  };
}

export default async function BlindPage({ params }: Props) {
  const { slug } = await params;
  const item = await getCatalogItemBySlug(slug);
  if (!item || item.category !== "BLIND") notFound();

  return (
    <>
      <section className="bg-ink text-white">
        <Container className="py-4">
          <BackLink href="/blinds">All blinds</BackLink>
        </Container>
      </section>

      <Band tone="ink" className="pb-12 sm:pb-16 lg:pb-20">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
          <ImageStack keys={item.imageKeys} alt={item.name} />
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Eyebrow className="text-brand-tint">{item.brand ?? "Hunting blind"}</Eyebrow>
              {item.badge ? <Badge tone="brand">{item.badge}</Badge> : null}
            </div>
            <Heading as="h1" size="lg">
              {item.name}
            </Heading>
            <div className="display text-[44px] text-white sm:text-[52px]">{formatMoney(item.priceCents, item.priceNote)}</div>
            {item.stockNote ? <p className="m-0 text-[17px] font-bold text-brand-tint">{item.stockNote}</p> : null}
            <Prose text={item.description} className="text-[#e5e5e5]" />
            <div className="mt-2 flex flex-col gap-3">
              <ButtonLink href={SITE.phoneHref} className="display min-h-14 text-[22px] tracking-wide">
                <PhoneIcon className="h-5 w-5 shrink-0" /> <CallLabel label="Call to reserve" />
              </ButtonLink>
              <ButtonLink href={SITE.mapsUrl} target="_blank" rel="noreferrer" variant="outline-white">
                Directions to the lot
              </ButtonLink>
            </div>
            <p className="m-0 text-[15px] text-[#cfcfcf]">Installation available. Come climb into the display model before you decide.</p>
          </div>
        </div>
      </Band>
    </>
  );
}
