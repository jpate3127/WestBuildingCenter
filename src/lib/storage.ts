import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join, normalize, sep } from "node:path";

import { DeleteObjectCommand, GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * Where uploaded files live: the Railway storage bucket (S3-compatible) when
 * its credentials are set, else `data/uploads/` on disk for local work.
 * The database only ever stores the key (`images/<id>.webp`,
 * `files/<id>.pdf`); `/media/<key>` serves it from wherever it is.
 *
 * Env (Railway bucket → Credentials tab; reference as ${{Bucket.ENDPOINT}} etc.):
 *   BUCKET_ENDPOINT, BUCKET_NAME, BUCKET_ACCESS_KEY_ID, BUCKET_SECRET_ACCESS_KEY,
 *   BUCKET_REGION (default "auto"), BUCKET_FORCE_PATH_STYLE=true when the
 *   Credentials tab says path-style.
 */

export type StoredObject = { body: Buffer; contentType: string | null };

const LOCAL_ROOT = join(process.cwd(), "data", "uploads");

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function isBucketConfigured(): boolean {
  return Boolean(env("BUCKET_ENDPOINT") && env("BUCKET_NAME") && env("BUCKET_ACCESS_KEY_ID") && env("BUCKET_SECRET_ACCESS_KEY"));
}

let client: S3Client | null = null;
function s3(): S3Client {
  if (!client) {
    client = new S3Client({
      region: env("BUCKET_REGION") || "auto",
      endpoint: env("BUCKET_ENDPOINT"),
      forcePathStyle: env("BUCKET_FORCE_PATH_STYLE").toLowerCase() === "true",
      credentials: { accessKeyId: env("BUCKET_ACCESS_KEY_ID"), secretAccessKey: env("BUCKET_SECRET_ACCESS_KEY") },
    });
  }
  return client;
}

/** A key is a relative path of safe segments; anything else is refused. */
export function isSafeKey(key: string): boolean {
  return /^[a-z0-9][a-z0-9/._-]{0,200}$/i.test(key) && !key.includes("..") && !key.includes("//");
}

function localPath(key: string): string {
  const path = normalize(join(LOCAL_ROOT, key));
  if (!path.startsWith(LOCAL_ROOT + sep)) throw new Error("Bad storage key");
  return path;
}

const CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
};

export function contentTypeFor(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

export async function putObject(key: string, body: Buffer, contentType = contentTypeFor(key)): Promise<void> {
  if (!isSafeKey(key)) throw new Error("Bad storage key");
  if (isBucketConfigured()) {
    await s3().send(new PutObjectCommand({ Bucket: env("BUCKET_NAME"), Key: key, Body: body, ContentType: contentType }));
    return;
  }
  const path = localPath(key);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body);
}

/** The object, or null when it does not exist. */
export async function getObject(key: string): Promise<StoredObject | null> {
  if (!isSafeKey(key)) return null;
  if (isBucketConfigured()) {
    try {
      const result = await s3().send(new GetObjectCommand({ Bucket: env("BUCKET_NAME"), Key: key }));
      const bytes = await result.Body?.transformToByteArray();
      if (!bytes) return null;
      return { body: Buffer.from(bytes), contentType: result.ContentType ?? contentTypeFor(key) };
    } catch (error) {
      const name = (error as { name?: string })?.name;
      if (error instanceof NoSuchKey || name === "NoSuchKey" || name === "NotFound") return null;
      throw error;
    }
  }
  try {
    return { body: await readFile(localPath(key)), contentType: contentTypeFor(key) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function deleteObject(key: string): Promise<void> {
  if (!isSafeKey(key)) return;
  if (isBucketConfigured()) {
    await s3().send(new DeleteObjectCommand({ Bucket: env("BUCKET_NAME"), Key: key }));
    return;
  }
  await unlink(localPath(key)).catch(() => undefined);
}
