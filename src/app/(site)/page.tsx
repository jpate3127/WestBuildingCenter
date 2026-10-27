import Link from "next/link";

import { MediaImage } from "@/components/MediaImage";
import { AlertSignupForm } from "@/components/site/AlertSignupForm";
import { BlindCard, BlindRow, PickCard, ProjectCard, promotionPdfHref } from "@/components/site/cards";
import { ButtonLink, Container, Eyebrow, Heading, Section, Badge, cx } from "@/components/ui";
import { getContent } from "@/lib/content";
import { fmtDateRange, fmtEventWhen } from "@/lib/format";
import { PROJECT_TAG_LABELS, PROJECT_TAGS } from "@/lib/labels";
import { getCatalogByCategory, getFeaturedPicks, getFeaturedProject, getLivePromotions, getPublishedProjects } from "@/lib/queries";
import { ADDRESS_LINE, SITE } from "@/lib/site";

export default async function HomePage() {
  const [content, live, picks, blinds, featuredProject, projects] = await Promise.all([
    getContent(),
    getLivePromotions(),
    getFeaturedPicks(6),
    getCatalogByCategory("BLIND"),
    getFeaturedProject(),
    getPublishedProjects({ limit: 6 }),
  ]);
  const promo = live.featured;
  const event = live.nextEvent;
  const heroProject = featuredProject ?? projects[0] ?? null;
  const galleryProjects = projects.filter((p) => p.id !== heroProject?.id).slice(0, 6);
  const galleryTags = PROJECT_TAGS.filter((tag) => projects.some((p) => p.tags.includes(tag))).slice(0, 6);

  return (
    <>
      {event ? (
        <Link href={`/promotions/${event.slug}`} className="block bg-ink text-white">
          <Container className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2.5 text-center text-[14px] sm:text-[15px]">
            <Badge tone="brand">Event</Badge>
            <span>
              <strong>{event.title}</strong> · {fmtEventWhen(event.startsAt, event.endsAt)}
            </span>
            <span className="underline">Details</span>
          </Container>
        </Link>
      ) : null}

      {/* Deal alerts */}
      <Section tone="brand" id="alerts" className="py-10 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-[860px] text-center">
          <Badge className="text-[14px] sm:text-[16px]">{content["home.eyebrow"]}</Badge>
          <Heading as="h1" size="xl" className="mt-4 sm:mt-5">
            {content["home.headline"]}
          </Heading>
          <p className="mx-auto mt-4 max-w-[640px] text-[17px] sm:text-[21px]">{content["home.subhead"]}</p>
          <div className="mx-auto mt-6 max-w-[620px] sm:mt-8">
            <AlertSignupForm variant="hero" consentText={content["alerts.consent"]} frequencyText={content["alerts.frequency"]} showEmail={false} />
          </div>
        </div>
      </Section>

      {/* Projects & building */}
      <Section tone="cream" id="projects">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
          <figure className="relative m-0 overflow-hidden rounded-lg shadow-[0_12px_30px_rgba(60,40,20,0.18)] lg:w-1/2">
            <MediaImage imageKey={heroProject?.imageKeys[0]} alt={heroProject?.title ?? "A project built with West Building Center materials"} className="h-60 w-full object-cover sm:h-80 lg:h-[460px]" loading="eager" fallback="A local project" />
            {heroProject ? (
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8 text-[15px] font-semibold text-white">
                {heroProject.title}
                {heroProject.location ? ` · ${heroProject.location}` : ""}
              </figcaption>
            ) : null}
          </figure>
          <div className="lg:w-1/2">
            <Eyebrow className="text-cream-dark">{content["home.projectsEyebrow"]}</Eyebrow>
            <Heading size="lg" className="mt-2 normal-case tracking-normal">
              {content["home.projectsHeadline"]}
            </Heading>
            <p className="mt-4 text-[17px] sm:text-[19px]">{content["home.projectsText"]}</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Materials lists from your plans", "Whole house, addition or deck"],
                ["Special-order windows, doors & siding", "Sized to your openings"],
                ["Kitchen & cabinet design help", "Cabinets, quartz countertops"],
                ["Delivery to your job site", "Farm, lot or driveway"],
              ].map(([title, sub]) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand">
                    <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                  <span>
                    <strong>{title}</strong>
                    <br />
                    <span className="text-[15px] text-cream-muted">{sub}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/projects/estimate">Start a project estimate</ButtonLink>
              <ButtonLink href="/projects" variant="outline">
                See local projects
              </ButtonLink>
            </div>
          </div>
        </div>

        {galleryProjects.length ? (
          <div className="mt-14 lg:mt-20">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <Heading size="md" className="normal-case tracking-normal">
                  Built with West Building Center
                </Heading>
                <p className="mt-1 text-cream-muted">Real projects from our neighbors, with materials from our yard.</p>
              </div>
              <Link href="/projects" className="font-bold text-brand">
                See all projects →
              </Link>
            </div>
            {galleryTags.length > 1 ? (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                <Link href="/projects" className="shrink-0 rounded-full bg-ink px-4 py-2 text-[14px] font-semibold text-white">
                  All
                </Link>
                {galleryTags.map((tag) => (
                  <Link key={tag} href={`/projects?tag=${tag}`} className="shrink-0 rounded-full border border-[#d8cfc4] bg-white px-4 py-2 text-[14px] font-semibold text-ink">
                    {PROJECT_TAG_LABELS[tag]}
                  </Link>
                ))}
              </div>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3">
              {galleryProjects.map((project) => (
                <ProjectCard key={project.id} project={project} compact />
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-3 rounded-lg bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <span className="text-[17px]">
                <strong>Bought your materials here?</strong> Send us a photo of the finished job and we&apos;ll feature it.
              </span>
              <ButtonLink href="/projects/share" variant="ink">
                Share your project
              </ButtonLink>
            </div>
          </div>
        ) : null}
      </Section>

      {/* This month's promo */}
      {promo ? (
        <Section tone="white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-12">
            <Link href={`/promotions/${promo.slug}`} className="relative block overflow-hidden rounded-md border border-line shadow-[0_10px_28px_rgba(0,0,0,0.14)] lg:w-[55%]">
              <MediaImage imageKey={promo.imageKey} alt={`${promo.title} flyer`} className="w-full" loading="eager" fallback="Flyer" />
              <span className="absolute bottom-3 right-3 rounded bg-ink px-3 py-1.5 text-[14px] font-bold text-white">{promo.pdfKey ? "Open the full PDF" : "See details"}</span>
            </Link>
            <div className="flex flex-col items-start gap-3 lg:w-[45%]">
              <Eyebrow className="text-brand">{promo.brand ? `This month's ${promo.brand} promo` : "This month's promo"}</Eyebrow>
              <Heading size="lg">{promo.title}</Heading>
              {fmtDateRange(promo.startsAt, promo.endsAt) ? <Badge>{fmtDateRange(promo.startsAt, promo.endsAt)}</Badge> : null}
              {promo.summary ? <p className="m-0 text-[17px] text-[#333]">{promo.summary}</p> : null}
              <div className="mt-1 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <ButtonLink href={promotionPdfHref(promo) ?? `/promotions/${promo.slug}`} target={promo.pdfKey ? "_blank" : undefined}>
                  {promo.pdfKey ? "Open the full flyer (PDF)" : "See the deal"}
                </ButtonLink>
                <ButtonLink href={SITE.phoneHref} variant="outline">
                  Call to check stock
                </ButtonLink>
              </div>
              <Link href="/promotions" className="text-[15px] font-semibold text-brand">
                Past promotions →
              </Link>
            </div>
          </div>
        </Section>
      ) : null}

      {/* Top picks */}
      {picks.length ? (
        <Section tone="paper">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Eyebrow className="text-brand">Picked by the WBC crew</Eyebrow>
              <Heading size="lg" className="mt-1">
                {content["home.picksHeadline"]}
              </Heading>
            </div>
            <p className="m-0 max-w-[380px] text-muted">{content["home.picksText"]}</p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-3">
            {picks.map((item) => (
              <div key={item.id}>
                <div className="sm:hidden">
                  <PickCard item={item} compact />
                </div>
                <div className="hidden sm:block">
                  <PickCard item={item} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[14px] text-muted sm:hidden">Tap any deal to open the full flyer.</p>
        </Section>
      ) : null}

      {/* Blinds */}
      {blinds.length ? (
        <Section tone="ink">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow className="text-brand-tint">In stock · We install</Eyebrow>
              <Heading size="lg" className="mt-1">
                {content["home.blindsHeadline"]}
              </Heading>
            </div>
            <ButtonLink href={SITE.phoneHref} className="hidden sm:inline-flex">
              Call to reserve
            </ButtonLink>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:hidden">
            {blinds.slice(0, 4).map((item) => (
              <BlindRow key={item.id} item={item} />
            ))}
          </div>
          <div className="mt-6 hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
            {blinds.slice(0, 3).map((item) => (
              <BlindCard key={item.id} item={item} />
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href={SITE.phoneHref} className="sm:hidden">
              Call to reserve
            </ButtonLink>
            <ButtonLink href="/blinds" variant="outline-white">
              All blinds &amp; cameras
            </ButtonLink>
            <p className="m-0 text-[#cfcfcf]">{content["home.blindsText"]}</p>
          </div>
        </Section>
      ) : null}

      {/* Business + visit */}
      <Section tone="paper">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-md bg-white p-5 sm:p-8">
            <Eyebrow className="text-brand">For contractors, shops &amp; plants</Eyebrow>
            <Heading size="md">{content["business.headline"]}</Heading>
            <p className="m-0 text-[#333]">{content["business.text"]}</p>
            <ButtonLink href="/business" variant="ink" className="self-start">
              Request a business quote
            </ButtonLink>
          </div>
          <div className="flex flex-col overflow-hidden rounded-md bg-white">
            <MediaImage imageKey={null} alt="" className="hidden" />
            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-8">
              <div>
                <Heading size="sm">Visit</Heading>
                <p className="mt-2">
                  <strong>{SITE.address.street}</strong>
                  <br />
                  {SITE.address.city}, {SITE.address.state} {SITE.address.zip}
                  <br />
                  {content["store.directions"]}
                </p>
                <a href={SITE.mapsUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block font-bold text-brand">
                  Get directions →
                </a>
              </div>
              <div>
                <Heading size="sm">Hours</Heading>
                <p className="mt-2 whitespace-pre-line">{content["store.hours"]}</p>
                <p className="mt-2 font-bold">{content["store.delivery"]}</p>
                <a href={SITE.phoneHref} className="display mt-1 inline-block text-[26px] text-ink">
                  {SITE.phoneDisplay}
                </a>
              </div>
            </div>
            <div className={cx("bg-paper px-5 py-3 text-[14px] text-muted sm:px-8")}>{ADDRESS_LINE}</div>
          </div>
        </div>
      </Section>
    </>
  );
}
