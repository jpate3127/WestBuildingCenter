"use client";

import { useActionState } from "react";

import { sendContact } from "@/app/(site)/contact/actions";
import { initialFormState } from "@/components/site/formState";
import { Button, Field, Honeypot, Input, Notice, Textarea } from "@/components/ui";
import { SITE } from "@/lib/site";

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContact, initialFormState);
  const errors = state.errors ?? {};

  if (state.status === "ok") {
    return (
      <div role="status" className="rounded-md border border-[#b7dcc0] bg-[#eaf6ed] p-5 text-[#14532d]">
        <div className="display text-[30px]">Thanks.</div>
        <p className="mt-2 text-[17px] font-medium">We&apos;ll get back to you within a business day.</p>
        <p className="mt-2 font-medium">
          Need an answer now? Call{" "}
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
      <Field label="Your name" error={errors.name}>
        <Input name="name" type="text" autoComplete="name" required />
      </Field>
      <Field label="Phone or email" error={errors.contact}>
        <Input name="contact" type="text" autoComplete="tel" required />
      </Field>
      <Field label="Message" error={errors.message}>
        <Textarea name="message" rows={5} required placeholder="Do you have… / Can you order… / I need a price on…" />
      </Field>

      {state.status === "error" && state.message ? <Notice tone="error">{state.message}</Notice> : null}

      <Button type="submit" disabled={pending} className="display h-14 text-[22px] tracking-wide">
        {pending ? "Sending…" : "Send"}
      </Button>
    </form>
  );
}
