import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, Flash, PageHeader, StatusPill } from "@/components/admin/bits";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/db";

import { ProjectForm } from "../ProjectForm";

export const metadata: Metadata = { title: "Edit project" };

export default async function EditProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/projects/${id}`);
  const query = await searchParams;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();
  return (
    <div className="mx-auto max-w-[640px]">
      <PageHeader title={project.title} back={{ href: `/admin/projects?status=${project.status}`, label: "Projects" }}>
        <p className="m-0 flex items-center gap-2 text-[14px] text-muted">
          <StatusPill status={project.status} />
          {project.status === "PUBLISHED" ? (
            <Link href={`/projects/${project.slug}`} target="_blank" className="font-semibold text-brand underline">
              /projects/{project.slug}
            </Link>
          ) : null}
        </p>
      </PageHeader>
      <Flash params={query} />
      <Card>
        <ProjectForm project={project} />
      </Card>
    </div>
  );
}
