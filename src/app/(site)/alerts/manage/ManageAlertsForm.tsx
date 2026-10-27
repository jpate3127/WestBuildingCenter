"use client";

import Link from "next/link";
import { useActionState } from "react";

import { stopChannels } from "@/app/(site)/alerts/manage/actions";
import { initialFormState } from "@/components/site/formState";
import { Button, Notice } from "@/components/ui";

type Props = {
  token: string;
  /** Masked, e.g. "(660) ***-4444". */
  phoneMasked: string | null;
  email: string | null;
  smsActive: boolean;
  emailActive: boolean;
};

export function ManageAlertsForm({ token, phoneMasked, email, smsActive, emailActive }: Props) {
  const [state, action, pending] = useActionState(stopChannels, initialFormState);

  if (state.status === "ok") {
    return (
      <div role="status" className="rounded-md border border-[#b7dcc0] bg-[#eaf6ed] p-5 text-[#14532d]">
        <div className="display text-[30px]">Done.</div>
        <p className="mt-2 text-[17px] font-medium">{state.message}</p>
        <p className="mt-2 font-medium">
          Changed your mind later? Sign up again on the{" "}
          <Link href="/alerts" className="underline">
            alerts page
          </Link>{" "}
          or reply START to one of our texts.
        </p>
      </div>
    );
  }

  const nothingOn = !smsActive && !emailActive;

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      {phoneMasked ? (
        <label className="flex min-h-14 items-center gap-3 rounded border border-[#bdbdbd] bg-white px-4 py-3">
          <input type="checkbox" name="sms" disabled={!smsActive} className="h-5 w-5 shrink-0 accent-ink" />
          <span className="flex-1">
            <strong>Stop texts</strong> to {phoneMasked}
            <br />
            <span className="text-[14px] text-muted">{smsActive ? "Currently on" : "Already off"}</span>
          </span>
        </label>
      ) : null}
      {email ? (
        <label className="flex min-h-14 items-center gap-3 rounded border border-[#bdbdbd] bg-white px-4 py-3">
          <input type="checkbox" name="email" disabled={!emailActive} className="h-5 w-5 shrink-0 accent-ink" />
          <span className="flex-1 break-all">
            <strong>Stop emails</strong> to {email}
            <br />
            <span className="text-[14px] text-muted">{emailActive ? "Currently on" : "Already off"}</span>
          </span>
        </label>
      ) : null}

      {state.status === "error" && state.message ? <Notice tone="error">{state.message}</Notice> : null}

      <Button type="submit" variant="ink" disabled={pending || nothingOn} className="h-12">
        {pending ? "Saving…" : "Stop the ones I ticked"}
      </Button>
      <p className="m-0 text-[14px] text-muted">
        To start again, sign up on{" "}
        <Link href="/alerts" className="underline">
          the alerts page
        </Link>{" "}
        or reply START to one of our texts.
      </p>
    </form>
  );
}
