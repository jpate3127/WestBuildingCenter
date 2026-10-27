"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { backWithError, backWithOk } from "@/components/admin/form";
import { requireAdminAction } from "@/lib/authz";
import { CONTENT_DEFAULTS } from "@/lib/content";
import { prisma } from "@/lib/db";

const schema = z.object({
  banner: z.string().trim().max(200),
  bannerLink: z.string().trim().max(300),
});

/** The announcement bar, edited right on the dashboard because it changes weekly. */
export async function saveBanner(formData: FormData): Promise<void> {
  const admin = await requireAdminAction();
  const parsed = schema.safeParse({ banner: formData.get("banner") ?? "", bannerLink: formData.get("bannerLink") ?? "" });
  if (!parsed.success) backWithError("/admin", "The announcement bar can be at most 200 characters.");
  const { banner, bannerLink } = parsed.data;
  if (bannerLink && !/^(\/|https?:\/\/)/.test(bannerLink)) backWithError("/admin", "The link should start with / (a page on this site) or https://");

  const upsert = async (key: "site.banner" | "site.bannerLink", value: string) => {
    if (value === CONTENT_DEFAULTS[key].default) {
      await prisma.contentBlock.deleteMany({ where: { key } });
    } else {
      await prisma.contentBlock.upsert({ where: { key }, create: { key, value, updatedBy: admin.email }, update: { value, updatedBy: admin.email } });
    }
  };
  await upsert("site.banner", banner);
  await upsert("site.bannerLink", bannerLink);
  revalidatePath("/", "layout");
  backWithOk("/admin", banner ? "Announcement bar updated." : "Announcement bar hidden.");
}
