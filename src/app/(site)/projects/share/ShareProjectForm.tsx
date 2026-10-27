"use client";

import Link from "next/link";
import { useActionState } from "react";

import { shareProject } from "@/app/(site)/projects/share/actions";
import { MAX_SHARE_PHOTOS } from "@/app/(site)/projects/share/constants";
import { initialFormState } from "@/components/site/formState";
import { Button, Field, Honeypot, Input, Notice, Textarea } from "@/components/ui";
import { PROJECT_TAG_LABELS, PROJECT_TAGS } from "@/lib/labels";

export function ShareProjectForm() {
  const [state, action, pending] = useActionState(shareProject, initialFormState);
  const errors = state.errors ?? {};

  if (state.status === "ok") {
    return (
      <div role="status" className="rounded-md border border-[#b7dcc0] bg-[#eaf6ed] p-5 text-[#14532d]">
        <div className="display text-[30px]">Thanks!</div>
        <p className="mt-2 text-[17px] font-medium">We&apos;ll look it over and add it to the gallery.</p>
        <p className="mt-2 font-medium">
          Someone from the store checks new photos every few days. Once it&apos;s up you&apos;ll find it on the{" "}
          <Link href="/projects" className="underline">
            projects page
          </Link>
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
        <Field label="Phone or email" hint="So we can say thanks. Not shown on the site." error={errors.contact}>
          <Input name="contact" type="text" autoComplete="tel" required />
        </Field>
      </div>
      <Field label="What did you build?" hint="A short name, like “New shop on Route K” or “Kitchen redo in Atlanta”." error={errors.title}>
        <Input name="title" type="text" required />
      </Field>
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2 text-sm font-bold">What kind of project? (check any that fit)</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PROJECT_TAGS.map((tag) => (
            <label key={tag} className="flex min-h-12 items-center gap-2.5 rounded border border-[#bdbdbd] bg-white px-3 text-[15px] font-medium">
              <input type="checkbox" name="tags" value={tag} className="h-5 w-5 shrink-0 accent-ink" />
              {PROJECT_TAG_LABELS[tag]}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="A sentence or two (optional)" hint="What you built, what you used from us, anything you're proud of." error={errors.caption}>
        <Textarea name="caption" rows={4} />
      </Field>
      <Field label="Photos" hint={`1 to ${MAX_SHARE_PHOTOS} photos of the finished job. Phone photos are perfect.`} error={errors.photos}>
        <input name="photos" type="file" multiple required accept="image/*" className="block w-full rounded border border-[#bdbdbd] bg-white p-2 text-base file:mr-3 file:rounded file:border-0 file:bg-ink file:px-4 file:py-2.5 file:font-bold file:text-white" />
      </Field>

      {state.status === "error" && state.message ? <Notice tone="error">{state.message}</Notice> : null}

      <Button type="submit" variant="ink" disabled={pending} className="display h-14 text-[22px] tracking-wide">
        {pending ? "Uploading…" : "Send my photos"}
      </Button>
      <p className="m-0 text-[13px] text-muted">By sending photos you let West Building Center show them on this site and our Facebook page. We won&apos;t show your name or contact info.</p>
    </form>
  );
}
