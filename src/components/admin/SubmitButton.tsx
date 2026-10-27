"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui";

type Props = ComponentProps<typeof Button> & { pendingText?: string };

/** A submit button that shows progress while the form (and its uploads) is sending. */
export function SubmitButton({ children, pendingText = "Saving…", disabled, ...props }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" {...props} disabled={disabled || pending} aria-busy={pending}>
      {pending ? pendingText : children}
    </Button>
  );
}
