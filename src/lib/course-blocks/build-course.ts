import { createHash } from "node:crypto";
import { courseDocumentSchema } from "./schema";
import { anchorFinalLecture } from "./lecture-parser";
import { parseSourceArticle } from "./source-parser";
import { applySemanticLabels, type SemanticLabel } from "./semantic-labels";
import type { CourseDocument } from "./types";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export function buildCourseDocument(input: { slug: string; title: string; sourceMarkdown: string; finalLectureMarkdown: string; labels: SemanticLabel[] }): CourseDocument {
  const source = parseSourceArticle(input.sourceMarkdown);
  const anchors = anchorFinalLecture(source, input.finalLectureMarkdown);
  const labeled = applySemanticLabels({ slug: input.slug, title: input.title, sourceHash: sha256(input.sourceMarkdown), finalLectureHash: sha256(anchors.normalizedText), finalLecture: anchors.normalizedText }, input.labels);
  return courseDocumentSchema.parse({ ...labeled, sourceHash: sha256(input.sourceMarkdown), finalLectureHash: sha256(anchors.normalizedText) });
}
