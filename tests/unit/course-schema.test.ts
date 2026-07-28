import { describe, expect, it } from "vitest";

import { validateCourse } from "@/lib/validation/course-schema";
import { seedCourse } from "../../scripts/seed-course";

describe("validateCourse", () => {
  it("rejects a guide that omits a sentence", () => {
    expect(() => validateCourse({
      ...seedCourse,
      paragraphGuides: [{ ...seedCourse.paragraphGuides[0], sentenceGuides: seedCourse.paragraphGuides[0].sentenceGuides.slice(0, 3) }],
    })).toThrow("does not cover every sentence");
  });

  it("rejects duplicate stable sentence IDs", () => {
    expect(() => validateCourse({
      ...seedCourse,
      paragraphs: [{ ...seedCourse.paragraphs[0], sentences: [seedCourse.paragraphs[0].sentences[0], seedCourse.paragraphs[0].sentences[0]] }],
    })).toThrow("duplicate sentence ID");
  });
});
