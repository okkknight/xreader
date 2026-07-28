import { describe, expect, it } from "vitest";

import { validateCourse } from "@/lib/validation/course-schema";
import { seedCourse } from "../../scripts/seed-course";

describe("validateCourse", () => {
  it("rejects ARTICLE_READ segments without sentence IDs", () => {
    expect(() => validateCourse({
      ...seedCourse,
      lessonSegments: [{ ...seedCourse.lessonSegments[2], order: 1, sentenceIds: [] }],
    })).toThrow("ARTICLE_READ");
  });

  it("rejects duplicate stable sentence IDs", () => {
    expect(() => validateCourse({
      ...seedCourse,
      paragraphs: [{ ...seedCourse.paragraphs[0], sentences: [seedCourse.paragraphs[0].sentences[0], seedCourse.paragraphs[0].sentences[0]] }],
    })).toThrow("duplicate sentence ID");
  });
});
