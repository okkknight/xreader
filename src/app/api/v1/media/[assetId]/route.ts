import { prisma } from "@/lib/db/client";
import { createMediaResponse } from "@/server/articles/media";

export async function GET(request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  return createMediaResponse(prisma, assetId, request.headers.get("range"), process.env.AUDIO_STORAGE_DIR || "data/audio");
}
