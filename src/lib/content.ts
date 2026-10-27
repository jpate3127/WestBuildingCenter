import { prisma } from "@/lib/db";

/**
 * Owner-editable copy. Each key has a default here; a ContentBlock row with
 * the same key overrides it. Add a key here and it appears on the admin
 * Content page automatically.
 */

export type ContentKey = keyof typeof CONTENT_DEFAULTS;

type ContentDef = { label: string; group: string; multiline?: boolean; help?: string; default: string };

export const CONTENT_DEFAULTS = {
  "site.banner": {
    label: "Announcement bar",
    group: "Store",
    help: "One line at the very top of every page. Leave blank to hide it. Example: Closed Saturday 11/18 · Milwaukee Days this Friday 8am–12pm",
    default: "",
  },
  "site.bannerLink": {
    label: "Announcement bar link",
    group: "Store",
    help: "Where the bar goes when tapped (optional). Example: /promotions/milwaukee-days",
    default: "",
  },
  "store.hours": {
    label: "Hours",
    group: "Store",
    multiline: true,
    help: "One line per day range.",
    default: "Mon–Fri 8:00–5:00\nSat 8:00–12:00\nSun closed",
  },
  "store.hoursShort": {
    label: "Hours (short)",
    group: "Store",
    help: "Shown in the header and footer.",
    default: "Mon–Fri 8–5 · Sat 8–12",
  },
  "store.email": {
    label: "Store email",
    group: "Store",
    help: "Where contact and quote forms are sent.",
    default: "westbuildingcenter@yahoo.com",
  },
  "store.directions": {
    label: "Directions hint",
    group: "Store",
    default: "Off US-63, 11 mi north of Macon",
  },
  "store.delivery": {
    label: "Delivery line",
    group: "Store",
    default: "Delivery available",
  },
  "home.eyebrow": { label: "Hero eyebrow", group: "Homepage", default: "MILWAUKEE DEAL ALERTS" },
  "home.headline": { label: "Hero headline", group: "Homepage", default: "Get the deal before it's gone." },
  "home.subhead": {
    label: "Hero text",
    group: "Homepage",
    multiline: true,
    default: "When the new Milwaukee promo drops, we text you the flyer, before the free batteries and tools are gone.",
  },
  "home.projectsEyebrow": { label: "Projects eyebrow", group: "Homepage", default: "BUILDING · REMODELING · FIXING UP" },
  "home.projectsHeadline": {
    label: "Projects headline",
    group: "Homepage",
    default: "Your project starts at our counter, not in a big-box aisle.",
  },
  "home.projectsText": {
    label: "Projects text",
    group: "Homepage",
    multiline: true,
    default:
      "Bring us your house plans or a sketch on a napkin. We'll build the materials list, price it, special-order what we don't stock, and deliver it to your site. And when you call, someone you know picks up.",
  },
  "home.picksHeadline": { label: "Top picks headline", group: "Homepage", default: "Top deals right now" },
  "home.picksText": {
    label: "Top picks text",
    group: "Homepage",
    default: "The deals our customers ask about most. Each one opens the full flyer.",
  },
  "home.blindsHeadline": { label: "Blinds headline", group: "Homepage", default: "Muddy & Hawk hunting blinds" },
  "home.blindsText": {
    label: "Blinds text",
    group: "Homepage",
    default: "Tactacam cellular cameras in stock too. Come climb into the display model.",
  },
  "business.headline": { label: "Business headline", group: "For businesses", default: "Stop overpaying the catalog." },
  "business.text": {
    label: "Business text",
    group: "For businesses",
    multiline: true,
    default:
      "Drill bits, blades, abrasives, fasteners and Milwaukee tools for your crew, often under catalog-supplier prices. Paste your list and we'll quote it, usually the same day.",
  },
  "projects.intro": {
    label: "Projects page intro",
    group: "Projects",
    multiline: true,
    default:
      "Whether you're building a house, putting up a shop, or finally redoing the kitchen, we'll figure the materials with you and get them to your site.",
  },
  "about.story": {
    label: "Our story",
    group: "About",
    multiline: true,
    help: "Blank lines start a new paragraph.",
    default:
      "West Building Center has been family-owned since 2014, when we took over the hardware store on Main Street and grew it into a full lumber yard.\n\nWe're a small crew, and that's on purpose: when you call, someone who knows your project picks up. We stock what northern Missouri builds with, special-order what we don't, and deliver to your site.\n\nYou'll find us at the homecoming parade, the Booster Club golf tournament, and in the stands for the Hornets.",
  },
  "alerts.consent": {
    label: "SMS consent wording",
    group: "Deal alerts",
    multiline: true,
    help: "Shown under every text sign-up form. Carriers check this wording.",
    default:
      "By signing up you agree to receive recurring promotional text messages from West Building Center at the number provided. Consent is not a condition of purchase. Message frequency varies (about 2–4 per month). Msg & data rates may apply. Reply STOP to cancel, HELP for help.",
  },
  "alerts.frequency": { label: "Alert frequency line", group: "Deal alerts", default: "Only when there's a new deal or event" },
} satisfies Record<string, ContentDef>;

export const CONTENT_KEYS = Object.keys(CONTENT_DEFAULTS) as ContentKey[];

export type Content = Record<ContentKey, string>;

/** Every key with its current value (row value, else the default). */
export async function getContent(): Promise<Content> {
  const rows = await prisma.contentBlock.findMany();
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const out = {} as Content;
  for (const key of CONTENT_KEYS) {
    const value = byKey.get(key);
    out[key] = value ?? CONTENT_DEFAULTS[key].default;
  }
  return out;
}

export function contentDef(key: ContentKey): ContentDef {
  return CONTENT_DEFAULTS[key];
}

/** Split owner-typed text into paragraphs on blank lines. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
