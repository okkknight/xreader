import { describe, expect, it } from "vitest";

import { evaluateQa } from "@/lib/validation/qa";
import { seedCourse } from "../../scripts/seed-course";

describe("evaluateQa", () => {
  it("blocks a course with stale audio", () => {
    expect(evaluateQa({ course: seedCourse, audioStatuses: ["STALE"] }).blockingIssues).toContain("STALE_AUDIO");
  });

  it("warns when deep sentence count is outside the target range", () => {
    const course = structuredClone(seedCourse);
    course.paragraphGuides.forEach((guide) => guide.sentenceGuides.forEach((sentence) => { sentence.depth = "QUICK"; }));
    const result = evaluateQa({ course, audioStatuses: [] });
    expect(result.warnings).toContain("DEEP_SENTENCE_COUNT_OUT_OF_RANGE");
  });
});
