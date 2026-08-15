import { access } from "node:fs/promises";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";

export type CourseReleasePlan = {
  slug: string;
  databasePath: string;
  audioRoot: string;
  audioPaths: string[];
};

export function resolveSqlitePath(databaseUrl: string) {
  if (!databaseUrl.startsWith("file:")) throw new Error("DATABASE_URL must use SQLite file: URLs");
  const relative = databaseUrl.slice("file:".length);
  return relative.startsWith("../data/") ? path.resolve(process.cwd(), "data", relative.slice("../data/".length)) : path.resolve(relative);
}

export async function buildCourseReleasePlan(db: PrismaClient, input: { slug: string; databaseUrl: string; audioRoot: string; now?: Date }): Promise<CourseReleasePlan> {
  const now = input.now ?? new Date();
  const article = await db.article.findFirst({
    where: { slug: input.slug, OR: [{ status: "PUBLISHED", publishedAt: { lte: now } }, { status: "SCHEDULED", scheduledAt: { lte: now } }] },
    include: { courseDocument: { include: { audio: true } } },
  });
  if (!article) throw new Error(`Course ${input.slug} is not publicly visible`);
  if (!article.courseDocument) throw new Error(`Course ${input.slug} has no imported course document`);
  if (article.courseDocument.audio.some((audio) => audio.status !== "READY")) throw new Error(`Course ${input.slug} has audio that is not READY`);

  const audioRoot = path.resolve(input.audioRoot);
  const audioPaths = [...new Set(article.courseDocument.audio.map((audio) => audio.path))].sort();
  for (const audioPath of audioPaths) {
    if (!audioPath.endsWith(".mp3")) throw new Error(`Course ${input.slug} references non-MP3 audio: ${audioPath}`);
    const resolved = path.resolve(audioRoot, audioPath);
    if (resolved === audioRoot || !resolved.startsWith(`${audioRoot}${path.sep}`)) throw new Error(`Course ${input.slug} references audio outside storage: ${audioPath}`);
    await access(resolved);
  }

  const databasePath = resolveSqlitePath(input.databaseUrl);
  await access(databasePath);
  return { slug: input.slug, databasePath, audioRoot, audioPaths };
}
