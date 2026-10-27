"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cx } from "@/components/ui";

const ITEMS: Array<{ href: string; label: string }> = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/promotions", label: "Promotions" },
  { href: "/admin/catalog", label: "Deals & Blinds" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/inquiries", label: "Inbox" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/admins", label: "Admins" },
];

/** Horizontal, thumb-scrollable section nav under the admin top bar. */
export function AdminNav({ inboxCount, submittedCount }: { inboxCount: number; submittedCount: number }) {
  const pathname = usePathname();
  const badge = (href: string) => (href === "/admin/inquiries" ? inboxCount : href === "/admin/projects" ? submittedCount : 0);
  return (
    <nav aria-label="Admin sections" className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1200px] gap-1 overflow-x-auto px-2 sm:px-4">
        {ITEMS.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          const n = badge(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "flex min-h-12 shrink-0 items-center gap-1.5 border-b-[3px] px-3 text-[15px] font-bold",
                active ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink",
              )}
            >
              {item.label}
              {n > 0 ? <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] text-white">{n}</span> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
