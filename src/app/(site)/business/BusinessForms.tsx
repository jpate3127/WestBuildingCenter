"use client";

import { useActionState } from "react";

import { openAccount, requestQuote } from "@/app/(site)/business/actions";
import { initialFormState } from "@/components/site/formState";
import { Button, Field, Honeypot, Input, Notice, Textarea } from "@/components/ui";
import { SITE } from "@/lib/site";

function Done({ title, text }: { title: string; text: string }) {
  return (
    <div role="status" className="rounded-md border border-[#b7dcc0] bg-[#eaf6ed] p-5 text-[#14532d]">
      <div className="display text-[30px]">{title}</div>
      <p className="mt-2 text-[17px] font-medium">{text}</p>
      <p className="mt-2 font-medium">
        Need it faster? Call{" "}
        <a href={SITE.phoneHref} className="underline">
          {SITE.phoneDisplay}
        </a>
        .
      </p>
    </div>
  );
}

function ContactFields({ errors, idPrefix }: { errors: Record<string, string>; idPrefix: string }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company or farm" error={errors.company}>
          <Input name="company" type="text" autoComplete="organization" required id={`${idPrefix}-company`} />
        </Field>
        <Field label="Your name" error={errors.name}>
          <Input name="name" type="text" autoComplete="name" required id={`${idPrefix}-name`} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone" error={errors.phone}>
          <Input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(660) 555-0123" required id={`${idPrefix}-phone`} />
        </Field>
        <Field label="Email (optional)" error={errors.email}>
          <Input name="email" type="email" inputMode="email" autoComplete="email" id={`${idPrefix}-email`} />
        </Field>
      </div>
    </>
  );
}

export function QuoteForm() {
  const [state, action, pending] = useActionState(requestQuote, initialFormState);
  const errors = state.errors ?? {};
  if (state.status === "ok") return <Done title="Got your list." text="We'll price it and get back to you, usually the same business day." />;

  return (
    <form action={action} className="relative flex flex-col gap-4">
      <Honeypot />
      <ContactFields errors={errors} idPrefix="quote" />
      <Field label="Part numbers or list" hint="Paste it straight from your catalog, PO or a text. Brand, part number and quantity is ideal, but “50 of the 1/2 inch Milwaukee masonry bits” works too." error={errors.message}>
        <Textarea name="message" rows={10} required placeholder={"48-89-4631  qty 10\n48-00-5026  qty 20\n3M 36 grit flap discs, 4.5 in  qty 50"} className="font-mono text-[15px]" />
      </Field>
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2 text-sm font-bold">How should we get back to you?</legend>
        <div className="grid grid-cols-3 gap-2">
          {["Call", "Text", "Email"].map((r, i) => (
            <label key={r} className="flex min-h-12 items-center justify-center gap-2 rounded border border-[#bdbdbd] bg-white px-3 text-[15px] font-semibold">
              <input type="radio" name="reach" value={r} defaultChecked={i === 0} className="h-5 w-5 accent-ink" />
              {r}
            </label>
          ))}
        </div>
        {errors.reach ? (
          <span role="alert" className="mt-1 block text-xs font-semibold text-brand">
            {errors.reach}
          </span>
        ) : null}
      </fieldset>

      {state.status === "error" && state.message ? <Notice tone="error">{state.message}</Notice> : null}

      <Button type="submit" disabled={pending} className="display h-14 text-[22px] tracking-wide">
        {pending ? "Sending…" : "Send for a quote"}
      </Button>
    </form>
  );
}

export function AccountForm() {
  const [state, action, pending] = useActionState(openAccount, initialFormState);
  const errors = state.errors ?? {};
  if (state.status === "ok") return <Done title="We'll be in touch." text="We'll call to set up your account and go over terms. Takes about five minutes." />;

  return (
    <form action={action} className="relative flex flex-col gap-4">
      <Honeypot />
      <ContactFields errors={errors} idPrefix="account" />
      <Field label="Anything we should know? (optional)" hint="What you buy most, how often, who's authorized to charge." error={errors.message}>
        <Textarea name="message" rows={3} />
      </Field>

      {state.status === "error" && state.message ? <Notice tone="error">{state.message}</Notice> : null}

      <Button type="submit" variant="ink" disabled={pending} className="h-12">
        {pending ? "Sending…" : "Ask about an account"}
      </Button>
    </form>
  );
}
