import Link from "next/link";

import { MobileActionBar } from "@/components/site/MobileActionBar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getContent } from "@/lib/content";
import { isOpenNow } from "@/lib/hours";
import { ADDRESS_LINE, SITE } from "@/lib/site";

// Every public page reads owner-edited content from Postgres. Rendering per
// request (not at build time) keeps `next build` from needing a database:
// Railway's build container cannot reach the private Postgres host.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const content = await getContent();
  const openNow = isOpenNow(content["store.hours"]);
  const banner = content["site.banner"].trim();
  const bannerLink = content["site.bannerLink"].trim();

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "HardwareStore",
    name: SITE.name,
    telephone: SITE.phoneE164,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.state,
      postalCode: SITE.address.zip,
      addressCountry: "US",
    },
    geo: { "@type": "GeoCoordinates", latitude: SITE.geo.lat, longitude: SITE.geo.lng },
    url: process.env.SITE_URL ?? "http://localhost:3000",
    sameAs: [SITE.facebookUrl],
    description: `Family-owned lumber yard and hardware store in ${SITE.address.city}, Missouri. Milwaukee tool dealer, Muddy and Hawk hunting blinds, lumber, electrical, plumbing. ${ADDRESS_LINE}.`,
  };

  return (
    <>
      {banner ? (
        bannerLink ? (
          <Link href={bannerLink} className="block bg-ink px-4 py-2.5 text-center text-sm font-semibold text-white">
            {banner} <span className="underline">Details</span>
          </Link>
        ) : (
          <div className="bg-ink px-4 py-2.5 text-center text-sm font-semibold text-white">{banner}</div>
        )
      ) : null}
      <SiteHeader hoursShort={content["store.hoursShort"]} openNow={openNow} />
      <main>{children}</main>
      <SiteFooter hours={content["store.hours"]} />
      <MobileActionBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
    </>
  );
}
