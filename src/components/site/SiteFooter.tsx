import Link from "next/link";

import { ADDRESS_LINE, SITE } from "@/lib/site";

export function SiteFooter({ hours }: { hours: string }) {
  return (
    <footer className="bg-ink text-[#cfcfcf]">
      <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <div className="display text-[24px] text-white">
            West <span className="text-brand-tint">Building Center</span>
          </div>
          <p className="mt-2 text-sm">Family-owned since 2014. Lumber, Milwaukee tools, hardware, electrical and plumbing for northern Missouri.</p>
        </div>
        <div className="text-sm">
          <div className="eyebrow mb-2 text-[13px] text-white">Visit</div>
          <p className="m-0">{ADDRESS_LINE}</p>
          <a href={SITE.phoneHref} className="mt-1 inline-block text-lg font-bold text-white">
            {SITE.phoneDisplay}
          </a>
          <br />
          <a href={SITE.mapsUrl} className="text-white underline" target="_blank" rel="noreferrer">
            Get directions
          </a>
        </div>
        <div className="text-sm">
          <div className="eyebrow mb-2 text-[13px] text-white">Hours</div>
          <p className="m-0 whitespace-pre-line">{hours}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <div className="eyebrow mb-0 text-[13px] text-white">More</div>
          <a href={SITE.facebookUrl} className="text-white" target="_blank" rel="noreferrer">
            Facebook
          </a>
          <Link href="/alerts" className="text-white">
            Get deal alerts
          </Link>
          <Link href="/alerts/manage" className="text-white">
            Manage alerts
          </Link>
          <Link href="/sms-terms" className="text-white">
            SMS terms
          </Link>
          <Link href="/privacy" className="text-white">
            Privacy
          </Link>
          <Link href="/admin" className="text-[#8a8a8a]">
            Staff sign-in
          </Link>
        </div>
      </div>
      <div className="border-t border-ink-3 py-4 text-center text-xs">
        © {new Date().getFullYear()} {SITE.name} · Atlanta, Missouri
      </div>
    </footer>
  );
}
