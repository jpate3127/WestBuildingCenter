import Link from "next/link";

import { MessageIcon, PhoneIcon, PinIcon } from "@/components/ui";
import { SITE } from "@/lib/site";

/** Sticky on phones: the three things people actually come to do. */
export function MobileActionBar() {
  const item = "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[12px] font-bold";
  return (
    <nav aria-label="Quick actions" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-line bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)] md:hidden">
      <a href={SITE.phoneHref} className={`${item} text-ink`}>
        <PhoneIcon className="h-5 w-5" /> Call
      </a>
      <a href={SITE.mapsUrl} target="_blank" rel="noreferrer" className={`${item} text-ink`}>
        <PinIcon className="h-5 w-5" /> Directions
      </a>
      <Link href="/alerts" className={`${item} bg-brand text-white`}>
        <MessageIcon className="h-5 w-5" /> Text me deals
      </Link>
    </nav>
  );
}
