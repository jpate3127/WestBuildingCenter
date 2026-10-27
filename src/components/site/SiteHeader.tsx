"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ButtonLink, OpenDot, PhoneIcon, cx } from "@/components/ui";
import { SITE } from "@/lib/site";

export const NAV = [
  { href: "/projects", label: "Projects & Building" },
  { href: "/promotions", label: "Milwaukee Deals" },
  { href: "/blinds", label: "Hunting Blinds" },
  { href: "/products", label: "Products" },
  { href: "/business", label: "For Businesses" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

type Props = { hoursShort: string; openNow: boolean };

export function SiteHeader({ hoursShort, openNow }: Props) {
  const pathname = usePathname();
  // The sheet closes when the route changes: remember which path it was opened on.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const setOpen = (next: boolean) => setOpenedOn(next ? pathname : null);

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:py-4">
        <Link href="/" className="display text-[22px] leading-[0.95] text-ink sm:text-[28px] lg:text-[32px]" aria-label={`${SITE.name} home`}>
          <span className="block lg:inline">West </span>
          <span className="text-brand">Building Center</span>
          <span className="eyebrow mt-1 hidden text-[12px] tracking-[0.22em] text-muted lg:block">Lumber · Electric · Hardware · Plumbing</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-5 font-semibold lg:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={cx("hover:text-brand", pathname.startsWith(item.href) && "text-brand")}>
              {item.label}
            </Link>
          ))}
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted">
            <OpenDot open={openNow} />
            {openNow ? "Open now" : hoursShort}
          </span>
          <ButtonLink href={SITE.phoneHref} variant="ink" className="min-h-11 px-4 py-2.5">
            <PhoneIcon /> {SITE.phoneDisplay}
          </ButtonLink>
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <a href={SITE.phoneHref} aria-label={`Call ${SITE.phoneDisplay}`} className="flex h-12 w-12 items-center justify-center rounded bg-ink text-white">
            <PhoneIcon className="h-5 w-5" />
          </a>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
            className="flex h-12 w-12 items-center justify-center rounded border border-[#bdbdbd] bg-white text-ink"
          >
            {open ? (
              <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            ) : (
              <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            )}
          </button>
        </div>
      </div>

      <div id="mobile-nav" hidden={!open} className="border-t border-line bg-white lg:hidden">
        <nav aria-label="Main" className="mx-auto flex w-full max-w-[1200px] flex-col px-4 py-2 sm:px-6">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={cx("border-b border-line py-3.5 text-lg font-semibold", pathname.startsWith(item.href) && "text-brand")}>
              {item.label}
            </Link>
          ))}
          <Link href="/alerts" className="py-3.5 text-lg font-bold text-brand">
            Get deal alerts →
          </Link>
          <div className="flex items-center gap-1.5 pb-3 text-sm font-medium text-muted">
            <OpenDot open={openNow} /> {openNow ? "Open now · " : ""}
            {hoursShort}
          </div>
        </nav>
      </div>
    </header>
  );
}
