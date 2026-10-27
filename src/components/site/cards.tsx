import Link from "next/link";

import type { CatalogItem, Project, Promotion } from "@/generated/prisma/client";
import { MediaImage } from "@/components/MediaImage";
import { Badge, cx } from "@/components/ui";
import { fmtDateRange, fmtEventWhen, formatMoney } from "@/lib/format";
import { PROJECT_TAG_LABELS } from "@/lib/labels";
import { mediaUrl } from "@/lib/media";

/** The cards the homepage and the list pages share. */

type PickItem = CatalogItem & { promotion?: { slug: string; pdfKey: string | null } | null };

/** Where a deal card goes: the flyer it belongs to, else its own page. */
export function catalogHref(item: PickItem): string {
  return item.promotion ? `/promotions/${item.promotion.slug}` : `/products/${item.slug}`;
}

export function PickCard({ item, compact = false }: { item: PickItem; compact?: boolean }) {
  const contain = item.category === "TOOL"; // flyer crops look better uncropped
  return (
    <Link href={catalogHref(item)} className="flex flex-col overflow-hidden rounded-md bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className={cx("relative border-b border-[#ececec] bg-white", compact ? "aspect-square" : "aspect-[4/3]")}>
        <MediaImage
          imageKey={item.imageKeys[0]}
          alt={item.name}
          size="thumb"
          className={cx("h-full w-full", contain ? "object-contain p-2" : "object-cover")}
          fallback="Photo coming"
        />
        {item.badge ? <Badge className={cx("absolute left-2 top-2", compact ? "text-[12px]" : "left-3 top-3 text-[14px]")}>{item.badge}</Badge> : null}
      </div>
      <div className={cx("flex flex-1 flex-col", compact ? "gap-0.5 p-2.5" : "gap-1 p-4")}>
        <div className={cx("display text-brand", compact ? "text-[24px]" : "text-[34px]")}>{formatMoney(item.priceCents, item.priceNote)}</div>
        <h3 className={cx("m-0 font-bold leading-snug", compact ? "text-[15px]" : "text-[18px]")}>{item.name}</h3>
        {!compact && item.stockNote ? <div className="text-[15px] text-muted">{item.stockNote}</div> : null}
        {!compact ? <span className="mt-auto pt-2 font-bold text-brand">{item.promotion ? "See it in the flyer →" : "Details →"}</span> : null}
      </div>
    </Link>
  );
}

export function BlindCard({ item }: { item: CatalogItem }) {
  return (
    <Link href={`/blinds/${item.slug}`} className="block overflow-hidden rounded bg-ink-2 text-white">
      <div className="h-1 bg-brand" />
      <MediaImage imageKey={item.imageKeys[0]} alt={item.name} className="h-56 w-full object-cover sm:h-64" fallback="Photo coming" />
      <div className="flex items-end justify-between gap-3 p-4 sm:p-5">
        <div>
          <h3 className="m-0 text-[20px] font-bold sm:text-[22px]">{item.name}</h3>
          {item.description ? <div className="text-[15px] text-[#cfcfcf]">{item.description.split("\n")[0]}</div> : null}
          {item.stockNote ? <div className="text-[14px] text-brand-tint">{item.stockNote}</div> : null}
        </div>
        <div className="display shrink-0 text-[32px] sm:text-[36px]">{formatMoney(item.priceCents, item.priceNote)}</div>
      </div>
    </Link>
  );
}

export function BlindRow({ item }: { item: CatalogItem }) {
  return (
    <Link href={`/blinds/${item.slug}`} className="flex items-center gap-3 rounded border-l-4 border-brand bg-ink-2 p-2.5 text-white">
      <MediaImage imageKey={item.imageKeys[0]} alt={item.name} size="thumb" className="h-20 w-20 shrink-0 rounded-sm object-cover" fallback="" />
      <div className="min-w-0 flex-1">
        <h3 className="m-0 text-[17px] font-bold">{item.name}</h3>
        {item.description ? <div className="truncate text-[14px] text-[#cfcfcf]">{item.description.split("\n")[0]}</div> : null}
      </div>
      <div className="display text-[24px]">{formatMoney(item.priceCents, item.priceNote)}</div>
    </Link>
  );
}

export function ProjectCard({ project, compact = false }: { project: Project; compact?: boolean }) {
  const tag = project.tags[0] ? PROJECT_TAG_LABELS[project.tags[0]] : null;
  return (
    <Link href={`/projects/${project.slug}`} className="relative block overflow-hidden rounded-md text-white">
      <MediaImage imageKey={project.imageKeys[0]} alt={project.title} size={compact ? "thumb" : "full"} className={cx("w-full object-cover", compact ? "h-36" : "h-56 sm:h-64")} fallback="Photo coming" />
      {tag && !compact ? <Badge tone="white" className="absolute left-3 top-3 normal-case tracking-normal">{tag}</Badge> : null}
      <span className={cx("absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent font-semibold", compact ? "px-2 pb-1.5 pt-6 text-[13px]" : "px-3.5 pb-3 pt-8 text-[16px]")}>
        {compact ? (tag ?? project.title) : project.title}
      </span>
    </Link>
  );
}

export function PromoCard({ promotion }: { promotion: Promotion }) {
  const isEvent = promotion.kind === "EVENT";
  const when = isEvent ? fmtEventWhen(promotion.startsAt, promotion.endsAt) : fmtDateRange(promotion.startsAt, promotion.endsAt);
  return (
    <Link href={`/promotions/${promotion.slug}`} className="flex gap-4 rounded-md border border-line bg-white p-3 text-ink sm:p-4">
      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-sm bg-paper sm:h-28 sm:w-24">
        {promotion.imageKey ? (
          <MediaImage imageKey={promotion.imageKey} alt="" size="thumb" className="h-full w-full object-cover object-top" />
        ) : (
          <div className="display flex h-full items-center justify-center text-[14px] text-muted">{isEvent ? "Event" : "Flyer"}</div>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <Badge tone={isEvent ? "brand" : "ink"} className="self-start">
          {isEvent ? "Event" : (promotion.brand ?? "Promo")}
        </Badge>
        <h3 className="m-0 text-[18px] font-bold leading-snug">{promotion.title}</h3>
        {when ? <div className="text-[14px] font-semibold text-muted">{when}</div> : null}
        <span className="mt-auto font-bold text-brand">{isEvent ? "Details →" : promotion.pdfKey ? "View flyer (PDF) →" : "Details →"}</span>
      </div>
    </Link>
  );
}

export function promotionPdfHref(promotion: Pick<Promotion, "pdfKey">): string | null {
  return promotion.pdfKey ? mediaUrl(promotion.pdfKey) : null;
}
