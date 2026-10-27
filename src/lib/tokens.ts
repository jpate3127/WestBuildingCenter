import { randomBytes } from "node:crypto";

/** URL-safe random token (32 bytes). */
export function newToken(): string {
  return randomBytes(32).toString("base64url");
}
