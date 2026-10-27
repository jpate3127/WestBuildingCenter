import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GoogleSignInButton } from "@/components/admin/GoogleSignInButton";
import { Notice } from "@/components/ui";
import { isGoogleSignInConfigured } from "@/lib/auth";
import { getAdmin } from "@/lib/authz";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Staff sign-in", robots: { index: false, follow: false } };

type Params = { next?: string | string[]; error?: string | string[] };

/** Only paths inside the admin are safe places to send someone after sign-in. */
function safeNext(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next || !next.startsWith("/admin") || next.startsWith("//") || next.startsWith("/admin/login")) return "/admin";
  return next;
}

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const admin = await getAdmin();
  if (admin) redirect(next);

  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const configured = isGoogleSignInConfigured();

  return (
    <main className="flex min-h-screen flex-col bg-paper">
      <div className="bg-ink px-4 py-3 text-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <span className="display text-[20px]">WBC Admin</span>
          <Link href="/" className="text-[13px] font-semibold text-white/80 hover:text-white">
            ← Back to the site
          </Link>
        </div>
      </div>
      <div className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center">
        <div className="w-full max-w-[420px] rounded-md border border-line bg-white p-6 sm:p-8">
          <div className="eyebrow text-[13px] text-brand">{SITE.name}</div>
          <h1 className="display mt-1 text-[34px]">Staff sign-in</h1>
          <p className="mt-2 text-[15px] text-muted">Use the Google account that&apos;s on the admin list.</p>

          <div className="mt-6 flex flex-col gap-4">
            {error ? (
              <Notice tone="error">
                That Google account isn&apos;t on the admin list. Ask Garrett or Joey to add it.
                {error !== "NOT_ALLOWED" && error !== "1" ? <span className="block text-xs opacity-80">({error})</span> : null}
              </Notice>
            ) : null}
            {!configured ? (
              <Notice tone="info">
                Google sign-in isn&apos;t set up on this server yet: <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> are not set. Add them (and <code>ADMIN_EMAILS</code>) to the environment, then redeploy.
              </Notice>
            ) : null}
            <GoogleSignInButton next={next} disabled={!configured} />
          </div>
        </div>
      </div>
    </main>
  );
}
