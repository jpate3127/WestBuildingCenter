import type { Metadata } from "next";
import Link from "next/link";

import type { ProjectStatus } from "@/generated/prisma/client";
import { Chips, Count, Empty, Flash, PageHeader, Pill } from "@/components/admin/bits";
import { MediaImage } from "@/components/MediaImage";
import { Button, ButtonLink } from "@/components/ui";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { PROJECT_TAG_LABELS } from "@/lib/labels";

import { setProjectStatus } from "./actions";

export const metadata: Metadata = { title: "Projects" };

type Params = { status?: string; ok?: string; error?: string };
const TABS: Array<{ status: ProjectStatus; label: string }> = [
  { status: "SUBMITTED", label: "Submitted" },
  { status: "PUBLISHED", label: "Published" },
  { status: "HIDDEN", label: "Hidden" },
];

export default async function AdminProjectsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin("/admin/projects");
  const params = await searchParams;
  const counts = Object.fromEntries((await prisma.project.groupBy({ by: ["status"], _count: { _all: true } })).map((g) => [g.status, g._count._all])) as Partial<Record<ProjectStatus, number>>;
  const requested = TABS.find((t) => t.status === params.status)?.status;
  // Land on Submitted when there is something to review, else on Published.
  const status: ProjectStatus = requested ?? ((counts.SUBMITTED ?? 0) > 0 ? "SUBMITTED" : "PUBLISHED");
  const back = `/admin/projects?status=${status}`;

  const projects = await prisma.project.findMany({
    where: { status },
    orderBy: status === "SUBMITTED" ? [{ createdAt: "desc" }] : [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <PageHeader title="Projects" action={<ButtonLink href="/admin/projects/new">Add project</ButtonLink>} />
      <Flash params={params} />
      <Chips
        items={TABS.map((tab) => ({
          href: `/admin/projects?status=${tab.status}`,
          active: status === tab.status,
          label: (
            <>
              {tab.label}
              {tab.status === "SUBMITTED" && (counts.SUBMITTED ?? 0) > 0 ? <Count n={counts.SUBMITTED ?? 0} /> : <span className="text-[12px] font-medium opacity-70">{counts[tab.status] ?? 0}</span>}
            </>
          ),
        }))}
      />

      {projects.length === 0 ? (
        <Empty className="mt-4">{status === "SUBMITTED" ? "Nothing waiting for review." : `No ${status.toLowerCase()} projects.`}</Empty>
      ) : (
        <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
          {projects.map((project) => (
            <li key={project.id} className="flex items-center gap-3 rounded-md border border-line bg-white p-3">
              <Link href={`/admin/projects/${project.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <MediaImage imageKey={project.imageKeys[0]} alt="" size="thumb" className="h-14 w-14 shrink-0 rounded object-cover" fallback="" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {project.featured ? <span className="text-brand">★</span> : null}
                    <span className="truncate text-[16px] font-bold">{project.title}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
                    {project.tags.length ? project.tags.map((tag) => <Pill key={tag}>{PROJECT_TAG_LABELS[tag]}</Pill>) : <Pill tone="yellow">no tags</Pill>}
                    {project.imageKeys.length === 0 ? <Pill tone="red">no photo</Pill> : null}
                    <span>
                      {project.submittedName ? `From ${project.submittedName} · ` : ""}
                      {fmtDate(project.createdAt)}
                    </span>
                  </div>
                </div>
              </Link>
              <form action={setProjectStatus} className="shrink-0">
                <input type="hidden" name="id" value={project.id} />
                <input type="hidden" name="back" value={back} />
                {project.status === "PUBLISHED" ? (
                  <>
                    <input type="hidden" name="status" value="HIDDEN" />
                    <Button type="submit" variant="outline" className="min-h-11 px-3 text-[14px]">
                      Hide
                    </Button>
                  </>
                ) : (
                  <>
                    <input type="hidden" name="status" value="PUBLISHED" />
                    <Button type="submit" variant="brand" className="min-h-11 px-3 text-[14px]">
                      Publish
                    </Button>
                  </>
                )}
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
