import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth, isAllowedAdminEmail } from "@/lib/auth";

export type AdminViewer = { email: string; name: string };

/**
 * Local development only: DEV_ADMIN_EMAIL acts as a signed-in admin so the
 * admin pages can be worked on without Google credentials. Ignored in
 * production builds no matter what is set.
 */
export function devAdmin(): AdminViewer | null {
  const email = process.env.DEV_ADMIN_EMAIL?.trim().toLowerCase();
  if (process.env.NODE_ENV === "production" || !email) return null;
  return { email, name: "Dev admin" };
}

/** The signed-in admin, or null. Checks the allowlist on every call. */
export async function getAdmin(): Promise<AdminViewer | null> {
  const dev = devAdmin();
  if (dev) return dev;
  let session: Awaited<ReturnType<typeof auth.api.getSession>> = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch (error) {
    console.warn("[auth] getSession failed", error);
    return null;
  }
  const email = session?.user?.email?.toLowerCase();
  if (!email || !(await isAllowedAdminEmail(email))) return null;
  return { email, name: session?.user?.name ?? email };
}

/** For admin pages and server actions: the admin, or a redirect to the login page. */
export async function requireAdmin(nextPath = "/admin"): Promise<AdminViewer> {
  const admin = await getAdmin();
  if (!admin) redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  return admin;
}

/** For server actions called from forms: throws instead of redirecting. */
export async function requireAdminAction(): Promise<AdminViewer> {
  const admin = await getAdmin();
  if (!admin) throw new Error("Sign in required.");
  return admin;
}
