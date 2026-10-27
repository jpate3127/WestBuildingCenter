"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signUpForAlerts, type AlertSignupState } from "@/app/(site)/alerts/actions";
import { Button, CheckIcon, Honeypot, cx } from "@/components/ui";

type Props = {
  /** The owner-editable consent wording. */
  consentText: string;
  frequencyText: string;
  /** "hero" is the red homepage band (white text); "card" is a white form on any page. */
  variant?: "hero" | "card";
  showEmail?: boolean;
  showName?: boolean;
};

const initial: AlertSignupState = { status: "idle" };

export function AlertSignupForm({ consentText, frequencyText, variant = "card", showEmail = true, showName = false }: Props) {
  const [state, action, pending] = useActionState(signUpForAlerts, initial);
  const onHero = variant === "hero";
  const inputClass = cx("h-14 w-full rounded border-0 px-4 text-lg font-medium text-ink placeholder:text-[#8a8a8a]", onHero ? "bg-white" : "bg-white border border-[#bdbdbd]");
  const labelClass = cx("flex flex-col gap-1.5 text-sm font-bold", onHero ? "text-white" : "text-ink");

  if (state.status === "ok") {
    return (
      <div role="status" className={cx("rounded p-5 text-left", onHero ? "bg-white text-ink" : "border border-[#b7dcc0] bg-[#eaf6ed] text-[#14532d]")}>
        <div className="display text-[28px]">{state.message ? "You're on the list." : "One more step."}</div>
        {state.message ? <p className="mt-2 font-medium">{state.message}</p> : null}
        {state.smsPending ? (
          <p className="mt-2 font-medium">
            <strong>Check your phone</strong> and reply <strong>YES</strong> to the text from West Building Center. That turns your alerts on.
          </p>
        ) : null}
        {state.emailPending ? (
          <p className="mt-2 font-medium">
            <strong>Check your email</strong> for a confirmation link.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form action={action} className="relative text-left">
      <Honeypot />
      <div className={cx("grid gap-3", showEmail && showName ? "sm:grid-cols-2" : "")}>
        {showName ? (
          <label className={labelClass}>
            Name
            <input name="name" type="text" autoComplete="name" className={inputClass} />
          </label>
        ) : null}
        <label className={cx(labelClass, !showName && showEmail ? "sm:col-span-1" : "")}>
          Mobile number
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(660) 555-0123" className={inputClass} />
        </label>
        {showEmail ? (
          <label className={labelClass}>
            Email <span className="font-medium opacity-80">(optional)</span>
            <input name="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" className={inputClass} />
          </label>
        ) : null}
      </div>

      <label className={cx("mt-3 flex items-start gap-3 text-[13px] leading-snug", onHero ? "text-white" : "text-muted")}>
        <input name="consent" type="checkbox" defaultChecked className="mt-0.5 h-5 w-5 shrink-0 accent-ink" />
        <span>{consentText}</span>
      </label>

      <Button type="submit" variant={onHero ? "ink" : "brand"} full disabled={pending} className="display mt-4 h-14 text-[22px] tracking-wide">
        {pending ? "Signing you up…" : "Text me deals"}
      </Button>

      {state.status === "error" ? (
        <p role="alert" className={cx("mt-3 rounded px-3 py-2 text-sm font-semibold", onHero ? "bg-ink text-white" : "bg-[#fdecef] text-brand-dark")}>
          {state.message}
        </p>
      ) : null}

      <ul className={cx("mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-[15px] font-semibold", onHero ? "text-white" : "text-ink")}>
        <li className="flex items-center gap-2">
          <CheckIcon /> {frequencyText}
        </li>
        <li className="flex items-center gap-2">
          <CheckIcon /> Reply STOP anytime
        </li>
        <li className="flex items-center gap-2">
          <CheckIcon /> We never share your number
        </li>
      </ul>
      <p className={cx("mt-3 text-xs", onHero ? "text-white/90" : "text-muted")}>
        <Link href="/sms-terms" className="underline">
          SMS terms
        </Link>{" "}
        ·{" "}
        <Link href="/privacy" className="underline">
          Privacy
        </Link>{" "}
        ·{" "}
        <Link href="/alerts/manage" className="underline">
          Manage or stop alerts
        </Link>
      </p>
    </form>
  );
}
