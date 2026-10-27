import type { Metadata } from "next";

import { Card, Flash, PageHeader } from "@/components/admin/bits";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Field, Input, Textarea } from "@/components/ui";
import { requireAdmin } from "@/lib/authz";
import { CONTENT_KEYS, contentDef, getContent, type ContentKey } from "@/lib/content";
import { prisma } from "@/lib/db";

import { saveContent } from "./actions";

export const metadata: Metadata = { title: "Site content" };

export default async function AdminContentPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin("/admin/content");
  const params = await searchParams;
  const [content, rows] = await Promise.all([getContent(), prisma.contentBlock.findMany({ select: { key: true } })]);
  const overridden = new Set(rows.map((r) => r.key));

  const groups = new Map<string, ContentKey[]>();
  for (const key of CONTENT_KEYS) {
    const group = contentDef(key).group;
    groups.set(group, [...(groups.get(group) ?? []), key]);
  }

  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeader title="Site content">
        <p className="m-0 text-[14px] text-muted">The words on the public pages. Changes show as soon as you save. “Reset” puts the original text back.</p>
      </PageHeader>
      <Flash params={params} />

      <form action={saveContent} className="flex flex-col gap-5">
        {[...groups.entries()].map(([group, keys]) => (
          <Card key={group} title={group}>
            <div className="flex flex-col gap-4">
              {keys.map((key) => {
                const def = contentDef(key);
                const changed = overridden.has(key);
                return (
                  <div key={key} className="flex flex-col gap-1.5">
                    <Field label={changed ? `${def.label} (edited)` : def.label} hint={def.help}>
                      {def.multiline ? <Textarea name={`v:${key}`} rows={Math.min(10, Math.max(3, content[key].split("\n").length + 1))} defaultValue={content[key]} maxLength={8000} /> : <Input name={`v:${key}`} defaultValue={content[key]} maxLength={8000} />}
                    </Field>
                    {changed ? (
                      <label className="flex items-center gap-2 self-start text-[13px] font-semibold text-muted">
                        <input type="checkbox" name={`reset:${key}`} className="h-5 w-5 accent-brand" /> Reset to the original text
                      </label>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
        <div className="sticky bottom-0 -mx-4 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
          <SubmitButton full className="h-14 text-[18px]">
            Save all content
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
