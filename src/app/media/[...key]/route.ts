import { NextResponse, type NextRequest } from "next/server";

import { getObject, isSafeKey } from "@/lib/storage";

/** Serves uploaded images and PDFs from the bucket (or local disk in dev). */
export async function GET(_request: NextRequest, context: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await context.params;
  const key = parts.join("/");
  if (!isSafeKey(key)) return new NextResponse("Not found", { status: 404 });
  const object = await getObject(key);
  if (!object) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(object.body), {
    headers: {
      "Content-Type": object.contentType ?? "application/octet-stream",
      "Content-Length": String(object.body.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      ...(key.endsWith(".pdf") ? { "Content-Disposition": `inline; filename="${key.split("/").pop()}"` } : {}),
    },
  });
}
