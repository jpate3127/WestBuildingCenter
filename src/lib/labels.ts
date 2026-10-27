import type { CatalogCategory, InquiryType, ProjectTag } from "@/generated/prisma/client";

/** Human labels for enums. Safe for client components (no server imports). */

export const PROJECT_TAG_LABELS: Record<ProjectTag, string> = {
  NEW_HOME: "New homes",
  SIDING: "Siding",
  KITCHEN: "Kitchens & cabinets",
  BATH: "Bathrooms",
  SHOP_BARN: "Shops & pole barns",
  OUTDOOR: "Outdoor living",
  DECK: "Decks & railing",
  ROOFING: "Roofing",
  WINDOWS_DOORS: "Windows & doors",
  OTHER: "Other projects",
};

export const PROJECT_TAGS = Object.keys(PROJECT_TAG_LABELS) as ProjectTag[];

export const CATALOG_CATEGORY_LABELS: Record<CatalogCategory, string> = {
  BLIND: "Hunting blinds",
  TOOL: "Milwaukee tools",
  OUTDOOR: "Outdoor & grills",
  DECKING: "Decking & railing",
  KITCHEN: "Kitchens & cabinets",
  LUMBER: "Lumber & building materials",
  OTHER: "Other",
};

export const CATALOG_CATEGORIES = Object.keys(CATALOG_CATEGORY_LABELS) as CatalogCategory[];

export const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = {
  CONTACT: "Contact",
  QUOTE: "Business quote",
  ACCOUNT: "Business account",
  PROJECT_ESTIMATE: "Project estimate",
};

/** What people are building: the choices on the estimate form. */
export const PROJECT_TYPES = ["New home", "Addition or remodel", "Shop or pole barn", "Deck or porch", "Siding", "Roofing", "Windows or doors", "Kitchen or bath", "Fence or outdoor", "Something else"] as const;
