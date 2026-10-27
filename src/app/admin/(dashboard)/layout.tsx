import type { Metadata } from "next";
import Link from "next/link";

import { AdminNav } from "@/components/admin/AdminNav";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · WBC Admin" }, robots: { index: false, follow: false } };

/**
 * The owners' back office. Everything under /admin except the login page
 * renders inside this chrome, which checks the session and the allowlist
 * on every request.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [inboxCount, submittedCount] = await Promise.all([
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.project.count({ where: { status: "SUBMITTED" } }),
  ]);

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <Link href="/admin" className="display text-[20px] text-white">
            WBC Admin
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate text-[13px] text-white/80">{admin.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <AdminNav inboxCount={inboxCount} submittedCount={submittedCount} />
      <main className="mx-auto w-full max-w-[1200px] px-4 py-5 sm:px-6 sm:py-8">{children}</main>
      <footer className="mx-auto max-w-[1200px] px-4 pb-8 text-[13px] text-muted sm:px-6">
        <Link href="/" className="font-semibold hover:text-ink">
          View the public site →
        </Link>
      </footer>
    </div>
  );
}
