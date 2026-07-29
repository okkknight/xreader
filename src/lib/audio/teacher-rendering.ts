import type { CourseBlock } from "@/lib/course-blocks/types";

import { ACTIVE_TEACHER_PERFORMANCE } from "./voice-library";

export function renderTeacherBlockText(block: CourseBlock, sourceSentenceById: Map<string, string>) {
  void sourceSentenceById;
  const raw = block.segments.map((segment) => segment.text).join(" ").trim();
  return `${ACTIVE_TEACHER_PERFORMANCE.direction} ${raw}`.trim();
}
