"use client";

import { useEffect } from "react";

import { Button, ButtonLink, Container, Heading } from "@/components/ui";
import { SITE } from "@/lib/site";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-16 text-center">
      <Heading as="h1" size="md">
        Something went wrong on our end.
      </Heading>
      <p className="mx-auto mt-3 max-w-md text-muted">Try again in a moment. If you need something right now, give us a call.</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button onClick={() => reset()} variant="ink">
          Try again
        </Button>
        <ButtonLink href={SITE.phoneHref}>Call {SITE.phoneDisplay}</ButtonLink>
      </div>
    </Container>
  );
}
