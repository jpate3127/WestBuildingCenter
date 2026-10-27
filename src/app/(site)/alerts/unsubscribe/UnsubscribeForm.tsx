"use client";

import Link from "next/link";
import { useActionState } from "react";

import { stopEverything } from "@/app/(site)/alerts/manage/actions";
import { initialFormState } from "@/components/site/formState";
import { Button, Notice } from "@/components/ui";

export function UnsubscribeForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(stopEverything, initialFormState);

  if (state.status === "ok") {
    return (
      <div role="status" className="rounded-md border border-[#b7dcc0] bg-[#eaf6ed] p-5 text-[#14532d]">
        <div className="display text-[30px]">You&apos;re unsubscribed.</div>
        <p className="mt-2 text-[17px] font-medium">{state.message}</p>
        <p className="mt-2 font-medium">
          Sorry to see you go. If you ever want back in, the{" "}
          <Link href="/alerts" className="underline">
            alerts page
          </Link>{" "}
          is always open.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      {state.status === "error" && state.message ? <Notice tone="error">{state.message}</Notice> : null}
      <Button type="submit" variant="ink" disabled={pending} className="display h-14 text-[22px] tracking-wide">
        {pending ? "One second…" : "Yes, unsubscribe me"}
      </Button>
      <Link href={`/alerts/manage?token=${encodeURIComponent(token)}`} className="inline-flex min-h-12 items-center justify-center font-semibold text-brand underline">
        Just stop one of them instead
      </Link>
    </form>
  );
}
