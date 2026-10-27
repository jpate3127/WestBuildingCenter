import type { Metadata } from "next";

import { Card, Flash, PageHeader } from "@/components/admin/bits";
import { requireAdmin } from "@/lib/authz";

import { ProjectForm } from "../ProjectForm";

export const metadata: Metadata = { title: "Add project" };

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin("/admin/projects/new");
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-[640px]">
      <PageHeader title="Add project" back={{ href: "/admin/projects", label: "Projects" }} />
      <Flash params={params} />
      <Card>
        <ProjectForm project={null} />
      </Card>
    </div>
  );
}
