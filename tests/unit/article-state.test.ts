import { describe, expect, it } from "vitest";

import { transitionArticle } from "@/server/publishing/article-state";

describe("transitionArticle", () => {
  it("rejects publishing directly from SCRIPTED", () => {
    expect(() => transitionArticle("SCRIPTED", "PUBLISHED")).toThrow("QA_PASSED");
  });

  it("permits publishing after QA", () => {
    expect(transitionArticle("QA_PASSED", "PUBLISHED")).toBe("PUBLISHED");
  });
});
