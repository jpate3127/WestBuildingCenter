import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";

import { prisma } from "@/lib/db";

/**
 * Better Auth: Google sign-in for the admin area, sessions in our database.
 *
 * Allowlist-only. A Google login whose email is neither in ADMIN_EMAILS nor
 * in the Admin table is refused before a User row exists. Removing an email
 * from the Admins page locks that person out on their next request
 * (src/lib/authz.ts checks the allowlist per request, not just at sign-in).
 *
 * Env: BETTER_AUTH_SECRET, BETTER_AUTH_URL (public origin),
 *      GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ADMIN_EMAILS (comma-separated).
 */

export const NOT_ALLOWED_CODE = "NOT_ALLOWED";

export function isGoogleSignInConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

/** Emails that are always admins, from the environment (the owners' bootstrap). */
export function envAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(/[,\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function isAllowedAdminEmail(email: string | null | undefined): Promise<boolean> {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;
  if (envAdminEmails().includes(normalized)) return true;
  const row = await prisma.admin.findUnique({ where: { email: normalized }, select: { id: true } });
  return Boolean(row);
}

export const auth = betterAuth({
  appName: "West Building Center",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  // A second Google identity could not slip past the allowlist, but keep it simple.
  account: { accountLinking: { enabled: false } },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!(await isAllowedAdminEmail(user.email))) {
            throw new APIError("UNAUTHORIZED", { message: "This Google account is not on the admin list.", code: NOT_ALLOWED_CODE });
          }
          return { data: { ...user, email: user.email.toLowerCase() } };
        },
      },
    },
  },
});
