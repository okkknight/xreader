import { describe, expect, it } from "vitest";
import { humanitiesReviewCourses } from "../../scripts/humanities-review-courses";
import { validateCourse } from "@/lib/validation/course-schema";
import { findDuplicateCourseBodies } from "@/lib/validation/qa";

describe("review course independence", () => {
  it("flags review courses that only reuse another course body", () => {
    expect(findDuplicateCourseBodies([{ id: "one", bodyText: "A distinct body." }, { id: "two", bodyText: "A  distinct\nbody." }])).toEqual([{ id: "two", matches: "one" }]);
  });

  it("ships four independent six-paragraph draft courses", () => {
    const bodies = humanitiesReviewCourses.map((course) => ({ id: course.article.id, bodyText: course.paragraphs.map((paragraph) => paragraph.text).join("\n\n") }));
    expect(humanitiesReviewCourses).toHaveLength(4);
    expect(findDuplicateCourseBodies(bodies)).toEqual([]);
    for (const course of humanitiesReviewCourses) {
      const wordCount = bodies.find((body) => body.id === course.article.id)!.bodyText.trim().split(/\s+/).length;
      expect(course.article.status).toBe("ARTICLE_DRAFT");
      expect(course.paragraphs).toHaveLength(6);
      expect(course.paragraphs.every((paragraph) => paragraph.sentences.length === 4)).toBe(true);
      expect(wordCount).toBeGreaterThanOrEqual(450);
      expect(wordCount).toBeLessThanOrEqual(600);
      expect(course.paragraphGuides).toHaveLength(6);
      expect(() => validateCourse(course)).not.toThrow();
    }
  });
});
