import { readFile } from "node:fs/promises";
import path from "node:path";

import type { PrismaClient } from "@prisma/client";

function parseRange(range: string | null, size: number) {
  if (!range) return { start: 0, end: size - 1, partial: false };
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) return null;
  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end >= size) return null;
  return { start, end, partial: true };
}

export async function createMediaResponse(db: PrismaClient, assetId: string, range: string | null, storageRoot: string) {
  const asset = await db.audioAsset.findFirst({ where: { id: assetId, status: "READY" } });
  if (!asset) return new Response("Not found", { status: 404 });
  const root = path.resolve(storageRoot);
  const resolved = path.resolve(root, asset.path);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) return new Response("Not found", { status: 404 });
  let bytes: Uint8Array;
  try { bytes = await readFile(resolved); } catch { return new Response("Not found", { status: 404 }); }
  const parsed = parseRange(range, bytes.byteLength);
  if (!parsed) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${bytes.byteLength}` } });
  const body = bytes.slice(parsed.start, parsed.end + 1);
  return new Response(body, { status: parsed.partial ? 206 : 200, headers: {
    "Content-Type": asset.format === "wav" ? "audio/wav" : "application/octet-stream",
    "Accept-Ranges": "bytes", "Content-Length": String(body.byteLength),
    ...(parsed.partial ? { "Content-Range": `bytes ${parsed.start}-${parsed.end}/${bytes.byteLength}` } : {}),
  } });
}
