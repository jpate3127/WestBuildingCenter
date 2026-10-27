import type { Metadata } from "next";

import { Pill } from "@/components/site/blocks";
import { ProjectCard } from "@/components/site/cards";
import { ButtonLink, CheckIcon, Eyebrow, Heading, Section } from "@/components/ui";
import { getContent } from "@/lib/content";
import { PROJECT_TAG_LABELS, PROJECT_TAGS } from "@/lib/labels";
import { getPublishedProjects } from "@/lib/queries";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Projects & Building",
  description: "Materials lists from your plans, special-order windows, doors and siding, kitchen design help and job-site delivery from West Building Center. See local projects built with our materials.",
};

const SERVICES = [
  ["Materials lists from your plans", "Whole house, addition or deck"],
  ["Special-order windows, doors & siding", "Sized to your openings"],
  ["Kitchen & cabinet design help", "Cabinets, quartz countertops"],
  ["Delivery to your job site", "Farm, lot or driveway"],
];

type Props = { searchParams: Promise<{ tag?: string | string[] }> };

export default async function ProjectsPage({ searchParams }: Props) {
  const { tag: rawTag } = await searchParams;
  const requested = Array.isArray(rawTag) ? rawTag[0] : rawTag;
  const tag = PROJECT_TAGS.find((t) => t === requested) ?? null;

  const [content, all, filtered] = await Promise.all([getContent(), getPublishedProjects(), tag ? getPublishedProjects({ tag }) : null]);
  const projects = filtered ?? all;
  const tagsWithProjects = PROJECT_TAGS.filter((t) => all.some((p) => p.tags.includes(t)));

  return (
    <>
      <Section tone="cream">
        <div className="max-w-[760px]">
          <Eyebrow className="text-cream-dark">{content["home.projectsEyebrow"]}</Eyebrow>
          <Heading as="h1" size="lg" className="mt-2 normal-case tracking-normal">
            {content["home.projectsHeadline"]}
          </Heading>
          <p className="mt-4 text-[17px] sm:text-[19px]">{content["projects.intro"]}</p>
        </div>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {SERVICES.map(([title, sub]) => (
            <li key={title} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand">
                <CheckIcon />
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
          <ButtonLink href="/projects/share" variant="outline">
            Share your project
          </ButtonLink>
        </div>
        <p className="mt-4 text-[15px] text-cream-muted">
          Or just call:{" "}
          <a href={SITE.phoneHref} className="font-bold text-cream-ink underline">
            {SITE.phoneDisplay}
          </a>
        </p>
      </Section>

      <Section id="gallery">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Heading size="md" className="normal-case tracking-normal">
              Built with West Building Center
            </Heading>
            <p className="mt-1 text-muted">Real projects from our neighbors, with materials from our yard.</p>
          </div>
        </div>

        {tagsWithProjects.length ? (
          <nav aria-label="Filter by project type" className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <Pill href="/projects#gallery" active={!tag}>
              All
            </Pill>
            {tagsWithProjects.map((t) => (
              <Pill key={t} href={`/projects?tag=${t}#gallery`} active={tag === t}>
                {PROJECT_TAG_LABELS[t]}
              </Pill>
            ))}
          </nav>
        ) : null}

        {projects.length ? (
          <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-md bg-paper p-5 text-[17px]">
            {tag ? (
              <p className="m-0">
                No {PROJECT_TAG_LABELS[tag].toLowerCase()} projects in the gallery yet. Did you build one with our materials? <strong>Send us a photo</strong> and we&apos;ll add it.
              </p>
            ) : (
              <p className="m-0">
                The gallery is just getting started. Bought your materials here? <strong>Send us a photo</strong> of the finished job and we&apos;ll feature it.
              </p>
            )}
            <ButtonLink href="/projects/share" variant="ink" className="mt-4">
              Share your project
            </ButtonLink>
          </div>
        )}

        {projects.length ? (
          <div className="mt-6 flex flex-col gap-3 rounded-lg bg-cream p-4 text-cream-ink sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <span className="text-[17px]">
              <strong>Bought your materials here?</strong> Send us a photo of the finished job and we&apos;ll feature it.
            </span>
            <ButtonLink href="/projects/share" variant="ink">
              Share your project
            </ButtonLink>
          </div>
        ) : null}
      </Section>
    </>
  );
}
