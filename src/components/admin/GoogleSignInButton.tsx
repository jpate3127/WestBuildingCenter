"use client";

import { useState } from "react";

import { Button } from "@/components/ui";
import { authClient } from "@/lib/authClient";

export function GoogleSignInButton({ next, disabled }: { next: string; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="ink"
        full
        disabled={disabled || busy}
        className="h-14 text-[17px]"
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const result = await authClient.signIn.social({ provider: "google", callbackURL: next, errorCallbackURL: "/admin/login?error=1" });
            if (result.error) {
              setError(result.error.message ?? "Sign-in didn't start. Try again.");
              setBusy(false);
            }
          } catch {
            setError("Sign-in didn't start. Check your connection and try again.");
            setBusy(false);
          }
        }}
      >
        <svg aria-hidden width="20" height="20" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.5 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.4 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
          <path fill="#FBBC05" d="M10.5 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" />
          <path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.6-5.9c-2.1 1.4-4.8 2.3-8 2.3-6.3 0-11.6-3.9-13.5-9.3l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
        </svg>
        {busy ? "Opening Google…" : "Continue with Google"}
      </Button>
      {error ? (
        <p role="alert" className="m-0 text-sm font-semibold text-brand">
          {error}
        </p>
      ) : null}
    </div>
  );
}
