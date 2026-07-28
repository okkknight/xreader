import { describe, expect, it } from "vitest";

import { evaluateQa } from "@/lib/validation/qa";
import { seedCourse } from "../../scripts/seed-course";

describe("evaluateQa", () => {
  it("blocks a course with stale audio", () => {
    expect(evaluateQa({ course: seedCourse, audioStatuses: ["STALE"] }).blockingIssues).toContain("STALE_AUDIO");
  });

  it("warns when guided teaching density is outside the target range", () => {
    const result = evaluateQa({ course: seedCourse, audioStatuses: [] });
    expect(result.warnings).toContain("PAUSE_COUNT_OUT_OF_RANGE");
  });
});
