"use client";

import { useActionState } from "react";

import { submitEstimate } from "@/app/(site)/projects/estimate/actions";
import { MAX_ESTIMATE_FILES, TIMELINES } from "@/app/(site)/projects/estimate/constants";
import { initialFormState } from "@/components/site/formState";
import { Button, Field, Honeypot, Input, Notice, Select, Textarea } from "@/components/ui";
import { PROJECT_TYPES } from "@/lib/labels";
import { SITE } from "@/lib/site";

export function EstimateForm() {
  const [state, action, pending] = useActionState(submitEstimate, initialFormState);
  const errors = state.errors ?? {};

  if (state.status === "ok") {
    return (
      <div role="status" className="rounded-md border border-[#b7dcc0] bg-[#eaf6ed] p-5 text-[#14532d]">
        <div className="display text-[30px]">Got it.</div>
        <p className="mt-2 text-[17px] font-medium">We&apos;ll call you within a business day.</p>
        <p className="mt-2 font-medium">
          Here&apos;s what happens next: we go through what you sent, build the materials list, price it, and call you to walk through it. Nothing is ordered until you say so.
        </p>
        <p className="mt-2 font-medium">
          In a hurry? Call{" "}
          <a href={SITE.phoneHref} className="underline">
            {SITE.phoneDisplay}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="relative flex flex-col gap-4">
      <Honeypot />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" error={errors.name}>
          <Input name="name" type="text" autoComplete="name" required />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <Input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(660) 555-0123" required />
        </Field>
      </div>
      <Field label="Email (optional)" hint="If you'd rather we email the list." error={errors.email}>
        <Input name="email" type="email" inputMode="email" autoComplete="email" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="What are you building?" error={errors.projectType}>
          <Select name="projectType" defaultValue="" required>
            <option value="" disabled>
              Pick one
            </option>
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="When?" error={errors.timeline}>
          <Select name="timeline" defaultValue="" required>
            <option value="" disabled>
              Pick one
            </option>
            {TIMELINES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Tell us about it" hint="Size, what you're thinking for siding, roofing, windows... whatever you know so far." error={errors.description}>
        <Textarea name="description" rows={6} required minLength={10} />
      </Field>
      <Field label="Plans or photos (optional)" hint={`Up to ${MAX_ESTIMATE_FILES} files: PDF plans, a sketch, or photos of the site. 25 MB each.`} error={errors.files}>
        <input name="files" type="file" multiple accept="image/*,.pdf,application/pdf" className="block w-full rounded border border-[#bdbdbd] bg-white p-2 text-base file:mr-3 file:rounded file:border-0 file:bg-ink file:px-4 file:py-2.5 file:font-bold file:text-white" />
      </Field>

      {state.status === "error" && state.message ? <Notice tone="error">{state.message}</Notice> : null}

      <Button type="submit" disabled={pending} className="display h-14 text-[22px] tracking-wide">
        {pending ? "Sending…" : "Send my project"}
      </Button>
      <p className="m-0 text-[13px] text-muted">We only use this to put your estimate together and call you back. No sales lists, ever.</p>
    </form>
  );
}
