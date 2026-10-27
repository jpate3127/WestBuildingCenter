import type { Metadata } from "next";
import Link from "next/link";

import type { Promotion } from "@/generated/prisma/client";
import { Band, PageHeader, SectionLead } from "@/components/site/blocks";
import { PromoCard } from "@/components/site/cards";
import { ButtonLink, Section } from "@/components/ui";
import { getAllPromotions, getLivePromotions } from "@/lib/queries";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Milwaukee Deals & Promotions",
  description: "Current Milwaukee flyers, sales events and giveaways at West Building Center in Atlanta, MO. Sign up to get the next one by text.",
};

export default async function PromotionsPage() {
  const now = new Date();
  const [live, all] = await Promise.all([getLivePromotions(now), getAllPromotions()]);

  // Right now: live flyers plus events that have started (or have no date yet).
  const rightNow: Promotion[] = [...live.promos, ...live.events.filter((e) => !e.startsAt || e.startsAt <= now)];
  const shown = new Set(rightNow.map((p) => p.id));
  // Coming up: anything published whose start is still ahead.
  const upcoming = all.filter((p) => !shown.has(p.id) && p.startsAt && p.startsAt > now && (!p.endsAt || p.endsAt >= now));
  for (const p of upcoming) shown.add(p.id);
  const past = all.filter((p) => !shown.has(p.id));

  return (
    <>
      <PageHeader eyebrow="Milwaukee deals · Events" title="Promotions" text="The current flyer, what's coming up, and the ones you missed. Every deal here is in the store, not just online." tone="paper">
        <ButtonLink href="/alerts">Text me the next deal</ButtonLink>
        <ButtonLink href={SITE.phoneHref} variant="outline">
          Call to check stock
        </ButtonLink>
      </PageHeader>

      <Section>
        <SectionLead eyebrow="Right now" title={rightNow.length ? "Live deals & events" : "Nothing running this minute"} />
        {rightNow.length ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rightNow.map((p) => (
              <PromoCard key={p.id} promotion={p} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-md bg-paper p-5 text-[17px]">
            <p className="m-0">
              The next Milwaukee flyer usually lands at the start of the month. <strong>Sign up for alerts</strong> and we&apos;ll text you the minute it does.
            </p>
            <ButtonLink href="/alerts" className="mt-4">
              Get deal alerts
            </ButtonLink>
          </div>
        )}
      </Section>

      {upcoming.length ? (
        <Section tone="paper">
          <SectionLead eyebrow="Coming up" title="Mark your calendar" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((p) => (
              <PromoCard key={p.id} promotion={p} />
            ))}
          </div>
        </Section>
      ) : null}

      <Band tone={upcoming.length ? "white" : "paper"} className="py-10 sm:py-12">
        {past.length ? (
          <details className="group">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3">
              <span>
                <span className="display text-[26px] sm:text-[30px]">Past promotions</span>
                <span className="ml-3 text-[15px] font-semibold text-muted">{past.length}</span>
              </span>
              <span className="font-bold text-brand group-open:hidden">Show</span>
              <span className="hidden font-bold text-brand group-open:inline">Hide</span>
            </summary>
            <p className="mt-2 text-[15px] text-muted">These have ended. Prices and stock in old flyers no longer apply, but call if you&apos;re after something you saw.</p>
            <div className="mt-4 grid gap-3 opacity-90 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((p) => (
                <PromoCard key={p.id} promotion={p} />
              ))}
            </div>
          </details>
        ) : (
          <p className="m-0 text-[15px] text-muted">
            Past promotions will show up here once a flyer ends.{" "}
            <Link href="/" className="font-semibold text-brand underline">
              Back home
            </Link>
          </p>
        )}
      </Band>
    </>
  );
}
