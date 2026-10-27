"use client";

import type { ComponentProps } from "react";

import { Button } from "@/components/ui";

type Props = ComponentProps<typeof Button> & { message: string };

/** A submit button that asks before it submits (deletes, mostly). */
export function ConfirmButton({ message, children, onClick, ...props }: Props) {
  return (
    <Button
      type="submit"
      {...props}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      {children}
    </Button>
  );
}
