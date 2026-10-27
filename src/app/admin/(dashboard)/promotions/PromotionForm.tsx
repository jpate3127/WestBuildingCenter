import type { Promotion } from "@/generated/prisma/client";
import { CheckboxRow } from "@/components/admin/bits";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { toDateInput, toTimeInput } from "@/components/admin/form";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { MediaImage } from "@/components/MediaImage";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { mediaUrl } from "@/lib/media";

import { deletePromotion, savePromotion } from "./actions";

/** One form for new and existing promotions; the server action tells them apart by `id`. */
export function PromotionForm({ promotion }: { promotion: Promotion | null }) {
  const isEvent = promotion?.kind === "EVENT";
  return (
    <form action={savePromotion} className="flex flex-col gap-4" encType="multipart/form-data">
      {promotion ? <input type="hidden" name="id" value={promotion.id} /> : null}

      <Field label="What is it?" hint="A promo runs for a date range (a Milwaukee flyer). An event is one day with a start and end time (Milwaukee Days).">
        <Select name="kind" defaultValue={promotion?.kind ?? "PROMO"}>
          <option value="PROMO">Promo / flyer</option>
          <option value="EVENT">Event</option>
        </Select>
      </Field>

      <Field label="Title">
        <Input name="title" defaultValue={promotion?.title ?? ""} required maxLength={120} placeholder="Milwaukee Fall Flyer" autoComplete="off" />
      </Field>

      <Field label="Brand" hint="Shown as “This month's Milwaukee promo”. Blank is fine.">
        <Input name="brand" defaultValue={promotion ? (promotion.brand ?? "") : "Milwaukee"} maxLength={60} />
      </Field>

      <Field label="One-line summary" hint="Goes in the text and email and on the card.">
        <Input name="summary" defaultValue={promotion?.summary ?? ""} maxLength={300} placeholder="Free battery with select M18 kits, through Nov 30" />
      </Field>

      <Field label="Details (optional)" hint="Shown on the promotion page. Blank lines start a new paragraph.">
        <Textarea name="body" rows={5} defaultValue={promotion?.body ?? ""} maxLength={8000} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={isEvent ? "Event date" : "Starts (optional)"} hint={isEvent ? undefined : "Leave blank to show it as soon as it's published."}>
          <Input name="startDate" type="date" defaultValue={toDateInput(promotion?.startsAt)} />
        </Field>
        <Field label="Ends (promo)" hint="The whole last day counts. Promos hide themselves the day after.">
          <Input name="endDate" type="date" defaultValue={!isEvent ? toDateInput(promotion?.endsAt) : ""} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start time (event)">
          <Input name="startTime" type="time" defaultValue={isEvent ? toTimeInput(promotion?.startsAt) : ""} step={900} />
        </Field>
        <Field label="End time (event)">
          <Input name="endTime" type="time" defaultValue={isEvent ? toTimeInput(promotion?.endsAt) : ""} step={900} />
        </Field>
      </div>

      <Field label="Cover image" hint="Flyer page 1 or an event graphic. Photos from your camera roll are fine; we resize them.">
        <Input name="image" type="file" accept="image/*" className="py-2" />
      </Field>
      {promotion?.imageKey ? (
        <div className="flex items-center gap-3">
          <MediaImage imageKey={promotion.imageKey} alt="" size="thumb" className="h-24 w-24 rounded border border-line object-cover" />
          <CheckboxRow name="removeImage" label="Remove this image" />
        </div>
      ) : null}

      <Field label="Flyer PDF" hint="The full flyer people open from the text. Up to 25 MB.">
        <Input name="pdf" type="file" accept="application/pdf" className="py-2" />
      </Field>
      {promotion?.pdfKey ? (
        <div className="flex flex-wrap items-center gap-3">
          <a href={mediaUrl(promotion.pdfKey)} target="_blank" rel="noreferrer" className="font-bold text-brand underline">
            Open current PDF
          </a>
          <CheckboxRow name="removePdf" label="Remove this PDF" />
        </div>
      ) : null}

      <CheckboxRow name="published" defaultChecked={Boolean(promotion?.publishedAt)} label="Published" hint="Unpublished promotions are drafts only you can see. Publish first, then send the alert." />

      <SubmitButton full className="h-14 text-[18px]" pendingText="Saving (uploading files)…">
        {promotion ? "Save changes" : "Create promotion"}
      </SubmitButton>

      {promotion ? (
        <ConfirmButton
          formAction={deletePromotion}
          formNoValidate
          message={`Delete "${promotion.title}"? Its files and alert history go with it. Links in texts already sent will stop working.`}
          variant="outline"
          className="border-brand text-brand hover:bg-brand hover:text-white"
        >
          Delete promotion
        </ConfirmButton>
      ) : null}
    </form>
  );
}
