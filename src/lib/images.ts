import { randomUUID } from "node:crypto";

import sharp from "sharp";

import { thumbKey } from "@/lib/media";
import { deleteObject, putObject } from "@/lib/storage";

/**
 * Upload pipeline for photos and flyers. Every image becomes a web-sized
 * WebP plus a thumbnail (see src/lib/media.ts); PDFs are stored as-is.
 * Returns the key the database should keep.
 */

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif"]);

export function isImageUpload(file: File): boolean {
  return IMAGE_TYPES.has(file.type) || /\.(jpe?g|png|webp|heic|heif|gif)$/i.test(file.name);
}

export function isPdfUpload(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export async function storeImage(input: Buffer | File): Promise<string> {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(await input.arrayBuffer());
  if (buffer.byteLength > MAX_UPLOAD_BYTES) throw new Error("Image is larger than 25 MB");
  const id = randomUUID();
  const key = `images/${id}.webp`;
  const base = sharp(buffer, { failOn: "none" }).rotate();
  const [large, thumb] = await Promise.all([
    base.clone().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(),
    base.clone().resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toBuffer(),
  ]);
  await Promise.all([putObject(key, large, "image/webp"), putObject(thumbKey(key), thumb, "image/webp")]);
  return key;
}

export async function storePdf(input: Buffer | File): Promise<string> {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(await input.arrayBuffer());
  if (buffer.byteLength > MAX_UPLOAD_BYTES) throw new Error("PDF is larger than 25 MB");
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") throw new Error("That file is not a PDF");
  const key = `files/${randomUUID()}.pdf`;
  await putObject(key, buffer, "application/pdf");
  return key;
}

/** Store an uploaded file by what it is; images and PDFs only. */
export async function storeUpload(file: File): Promise<string> {
  if (isPdfUpload(file)) return storePdf(file);
  if (isImageUpload(file)) return storeImage(file);
  throw new Error(`Unsupported file type: ${file.name}`);
}

export async function removeStored(key: string): Promise<void> {
  await deleteObject(key);
  if (key.endsWith(".webp")) await deleteObject(thumbKey(key));
}
