import type { ArticleStatus } from "@prisma/client";

const transitions: Record<ArticleStatus, ArticleStatus[]> = {
  IDEA: ["SOURCED"], SOURCED: ["ARTICLE_DRAFT"], ARTICLE_DRAFT: ["ARTICLE_EDITED"], ARTICLE_EDITED: ["BUILT"],
  BUILT: ["QA_PASSED"], QA_PASSED: ["SCHEDULED", "PUBLISHED"], SCHEDULED: ["PUBLISHED", "ARCHIVED"], PUBLISHED: ["ARCHIVED"], ARCHIVED: [],
};

export function transitionArticle(current: ArticleStatus, next: ArticleStatus): ArticleStatus {
  if (transitions[current].includes(next)) return next;
  if (next === "PUBLISHED" && current !== "QA_PASSED" && current !== "SCHEDULED") throw new Error("PUBLISHED requires QA_PASSED");
  throw new Error(`invalid article transition: ${current} -> ${next}`);
}
