import { describe, expect, it } from "vitest";
import { findDuplicateCourseBodies } from "@/lib/validation/qa";

describe("review course independence", () => {
  it("flags review courses that only reuse another course body", () => {
    expect(findDuplicateCourseBodies([{ id: "one", bodyText: "A distinct body." }, { id: "two", bodyText: "A  distinct\nbody." }])).toEqual([{ id: "two", matches: "one" }]);
  });
});
