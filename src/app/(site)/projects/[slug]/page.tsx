import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink, Band, ImageStack, Pill, Prose } from "@/components/site/blocks";
import { ButtonLink, Container, Eyebrow, Heading, PhoneIcon, PinIcon } from "@/components/ui";
import { PROJECT_TAG_LABELS } from "@/lib/labels";
import { mediaUrl } from "@/lib/media";
import { getProjectBySlug } from "@/lib/queries";
import { SITE } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };
  const description = project.caption ?? `${project.title}, built with materials from ${SITE.name}.`;
  return {
    title: project.title,
    description,
    openGraph: { title: project.title, description, ...(project.imageKeys[0] ? { images: [{ url: mediaUrl(project.imageKeys[0]), alt: project.title }] } : {}) },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <>
      <Container className="py-4">
        <BackLink href="/projects">All projects</BackLink>
      </Container>

      <Band className="pb-12 sm:pb-16 lg:pb-20">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
          <ImageStack keys={project.imageKeys} alt={project.title} />
          <div className="flex flex-col gap-4">
            <Eyebrow className="text-cream-dark">Built with West Building Center</Eyebrow>
            <Heading as="h1" size="lg" className="normal-case tracking-normal">
              {project.title}
            </Heading>
            {project.tags.length ? (
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Pill key={tag} href={`/projects?tag=${tag}#gallery`}>
                    {PROJECT_TAG_LABELS[tag]}
                  </Pill>
                ))}
              </div>
            ) : null}
            {project.caption ? <p className="m-0 text-[18px] font-semibold">{project.caption}</p> : null}
            {project.materials ? (
              <p className="m-0 rounded-md bg-cream p-4 text-[16px] text-cream-ink">
                <strong>Materials from WBC:</strong> {project.materials}
              </p>
            ) : null}
            <Prose text={project.body} />
            {project.location ? (
              <p className="m-0 flex items-center gap-2 text-[15px] text-muted">
                <PinIcon /> {project.location}
              </p>
            ) : null}
          </div>
        </div>
      </Band>

      <Band tone="cream" className="py-10 sm:py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Heading size="md" className="normal-case tracking-normal">
              Planning something like this?
            </Heading>
            <p className="mt-1 text-cream-muted">Bring us the plans or a sketch. We&apos;ll build the materials list and price it.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/projects/estimate">Start a project estimate</ButtonLink>
            <ButtonLink href={SITE.phoneHref} variant="outline">
              <PhoneIcon /> {SITE.phoneDisplay}
            </ButtonLink>
          </div>
        </div>
      </Band>
    </>
  );
}
