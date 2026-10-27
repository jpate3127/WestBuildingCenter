import type { Project } from "@/generated/prisma/client";
import { Card, CheckboxRow, DefinitionList } from "@/components/admin/bits";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { MediaImage } from "@/components/MediaImage";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { fmtDateTime } from "@/lib/format";
import { PROJECT_TAG_LABELS, PROJECT_TAGS } from "@/lib/labels";

import { deleteProject, saveProject } from "./actions";

export function ProjectForm({ project }: { project: Project | null }) {
  return (
    <form action={saveProject} className="flex flex-col gap-4" encType="multipart/form-data">
      {project ? <input type="hidden" name="id" value={project.id} /> : null}

      {project?.submittedName || project?.submittedContact ? (
        <Card title="Sent in by a customer" className="bg-paper">
          <DefinitionList
            items={[
              ["Name", project.submittedName ?? "—"],
              ["Contact", project.submittedContact ?? "—"],
              ["Received", fmtDateTime(project.createdAt)],
            ]}
          />
          <p className="mb-0 mt-2 text-[13px] text-muted">Not shown on the site. Check the photos, add tags and a caption, then set the status to Published.</p>
        </Card>
      ) : null}

      <Field label="Title">
        <Input name="title" defaultValue={project?.title ?? ""} required maxLength={120} placeholder="New farmhouse near La Plata" autoComplete="off" />
      </Field>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-1.5 text-sm font-bold">Tags</legend>
        <div className="grid grid-cols-2 gap-2">
          {PROJECT_TAGS.map((tag) => (
            <label key={tag} className="flex min-h-12 items-center gap-2.5 rounded border border-line px-3 text-[14px] font-semibold">
              <input type="checkbox" name="tags" value={tag} defaultChecked={project?.tags.includes(tag) ?? false} className="h-5 w-5 shrink-0 accent-brand" />
              {PROJECT_TAG_LABELS[tag]}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Caption" hint="One or two sentences under the photo.">
        <Input name="caption" defaultValue={project?.caption ?? ""} maxLength={300} />
      </Field>

      <Field label="Materials" hint="“LP SmartSide, Wolf cabinets, quartz countertops”">
        <Input name="materials" defaultValue={project?.materials ?? ""} maxLength={300} />
      </Field>

      <Field label="Story (optional)" hint="Blank lines start a new paragraph.">
        <Textarea name="body" rows={4} defaultValue={project?.body ?? ""} maxLength={8000} />
      </Field>

      <Field label="Location" hint="Town or area, like “Atlanta, MO” or “south of Macon”.">
        <Input name="location" defaultValue={project?.location ?? ""} maxLength={80} />
      </Field>

      <Field label="Photos" hint="Pick one or several from your camera roll.">
        <Input name="images" type="file" accept="image/*" multiple className="py-2" />
      </Field>
      {project?.imageKeys.length ? (
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3">
          {project.imageKeys.map((key, index) => (
            <li key={key} className="flex flex-col gap-1.5 rounded border border-line p-2">
              <MediaImage imageKey={key} alt="" size="thumb" className="aspect-square w-full rounded object-cover" />
              <label className="flex items-center gap-2 text-[13px] font-semibold">
                <input type="radio" name="firstImage" value={key} defaultChecked={index === 0} className="h-5 w-5 accent-brand" /> Main photo
              </label>
              <label className="flex items-center gap-2 text-[13px] font-semibold text-brand">
                <input type="checkbox" name="removeImage" value={key} className="h-5 w-5 accent-brand" /> Remove
              </label>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Status">
          <Select name="status" defaultValue={project?.status ?? "PUBLISHED"}>
            <option value="PUBLISHED">Published (on the site)</option>
            <option value="HIDDEN">Hidden</option>
            <option value="SUBMITTED">Submitted (still to review)</option>
          </Select>
        </Field>
        <Field label="Sort" hint="Lower numbers come first in the gallery.">
          <Input name="sortOrder" type="number" inputMode="numeric" defaultValue={project?.sortOrder ?? 0} />
        </Field>
      </div>

      <CheckboxRow name="featured" defaultChecked={project?.featured ?? false} label="Featured" hint="The big photo at the top of the homepage projects section." />

      <SubmitButton full className="h-14 text-[18px]" pendingText="Saving (uploading photos)…">
        {project ? "Save changes" : "Add project"}
      </SubmitButton>

      {project ? (
        <ConfirmButton formAction={deleteProject} formNoValidate message={`Delete "${project.title}" and its photos?`} variant="outline" className="border-brand text-brand hover:bg-brand hover:text-white">
          Delete project
        </ConfirmButton>
      ) : null}
    </form>
  );
}
