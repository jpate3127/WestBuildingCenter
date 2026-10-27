/**
 * Facts about the store that are not editable copy. Hours, hero text and the
 * like are ContentBlocks (src/lib/content.ts) so the owners can change them.
 */
export const SITE = {
  name: "West Building Center",
  shortName: "WBC",
  phoneDisplay: "(660) 239-4444",
  phoneE164: "+16602394444",
  phoneHref: "tel:+16602394444",
  address: {
    street: "206 W Main St",
    city: "Atlanta",
    state: "MO",
    zip: "63530",
  },
  mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=West+Building+Center%2C+206+W+Main+St%2C+Atlanta%2C+MO+63530",
  facebookUrl: "https://www.facebook.com/westbuildingcenter/",
  geo: { lat: 39.898645, lng: -92.481426 },
  timeZone: "America/Chicago",
} as const;

export const ADDRESS_LINE = `${SITE.address.street}, ${SITE.address.city}, ${SITE.address.state} ${SITE.address.zip}`;

/** The public origin for links in texts and emails. */
export function siteUrl(path = "/"): string {
  const base = (process.env.SITE_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
