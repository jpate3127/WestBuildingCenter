import { headers } from "next/headers";
import type { z } from "zod";

import { MAX_UPLOAD_BYTES, isImageUpload, isPdfUpload } from "@/lib/images";
import { rateLimited } from "@/lib/rateLimit";

/**
 * The bits every public server action repeats: who is sending, whether they
 * are sending too much, and what the uploads look like before we store them.
 */

export async function clientIp(): Promise<string> {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** True when this IP has sent `limit` forms of this kind in the window. */
export async function tooManyForms(kind: string, limit = 6, windowMs = 10 * 60 * 1000): Promise<boolean> {
  return rateLimited(`${kind}:${await clientIp()}`, limit, windowMs);
}

export const TOO_MANY_MESSAGE = "That's a lot of forms from one connection. Wait a few minutes or just give us a call.";

/** First message per field, keyed by field name. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/** Honeypot: bots fill the "website" field; people never see it. */
export function isBot(formData: FormData): boolean {
  const value = formData.get("website");
  return typeof value === "string" && value.length > 0;
}

type UploadCheck = { ok: true; files: File[] } | { ok: false; message: string };

/** The real files in a multi-file input, checked for count, size and type. */
export function pickUploads(formData: FormData, name: string, options: { max: number; pdf?: boolean }): UploadCheck {
  const files = formData.getAll(name).filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > options.max) return { ok: false, message: `Please attach at most ${options.max} files.` };
  for (const file of files) {
    if (file.size > MAX_UPLOAD_BYTES) return { ok: false, message: `${file.name} is larger than 25 MB. Try a smaller photo or a PDF.` };
    const allowed = isImageUpload(file) || (options.pdf && isPdfUpload(file));
    if (!allowed) return { ok: false, message: `${file.name} isn't a photo${options.pdf ? " or PDF" : ""}. Please attach JPG, PNG${options.pdf ? " or PDF" : ""} files.` };
  }
  return { ok: true, files };
}
