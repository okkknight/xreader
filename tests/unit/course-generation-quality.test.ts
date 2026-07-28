import { describe, expect, it } from "vitest";

import { courseGenerationPrompts } from "@/lib/course-generation/prompts";
import { instructionalQualityReviewSchema, languageLearningMapSchema, lessonDesignRationaleSchema, qualityEvidenceListSchema, teacherPerformancePlanSchema } from "@/lib/course-generation/schemas";

const dimensions = ["contentUnderstanding", "languageLearningValue", "contentLanguageIntegration", "instructionalNecessity", "languagePointSelection", "depthMatching", "cognitiveLoadControl", "teacherJudgment", "articleRhythm", "spokenNaturalness", "nonTemplateQuality"];

describe("instructional quality contract", () => {
  it("accepts rationale and teacher decisions without fixed count requirements", () => {
    expect(lessonDesignRationaleSchema.parse({ learnerObstacles: ["理解转折"], highestValueLanguageOpportunities: ["rather than"], complexButLowValueMaterial: [], groupingDecisions: [{ sentenceIds: ["s1"], reason: "共同完成一个解释" }], slowDownDecisions: [], speedThroughDecisions: [], rhythmRisks: [], teacherJudgmentNeeded: ["明确略过术语细节"], contentOutcome: "理解核心答案", languageOutcome: "理解一个可迁移搭配", whyNotCopyGoldStructure: "本文机制推进不同", cognitiveLoadRisk: "语言点过密" })).toBeTruthy();
    expect(teacherPerformancePlanSchema.parse({ moves: [{ id: "move-1", type: "MAKE_A_CHOICE", beatId: "beat-1", sentenceIds: ["s1"], purpose: "说明无需记忆术语", mustAvoid: "不要展开背景" }] })).toBeTruthy();
    expect(languageLearningMapSchema.parse([{ id: "lp-1", sentenceIds: ["s1"], category: "PHRASE", target: "rather than", meaningInContext: "而不是", functionInArticle: "限制结论", whyWorthLearning: "可迁移", transferValue: "可用于对比", likelyLearnerProblem: "直译", teachingDepth: "LIGHT" }])).toHaveLength(1);
  });

  it("requires evidence for every instructional score dimension", () => {
    const review = instructionalQualityReviewSchema.parse({ blocking: false, scores: Object.fromEntries(dimensions.map((dimension) => [dimension, 4])), issues: [] });
    const evidence = qualityEvidenceListSchema.parse(dimensions.map((dimension) => ({ dimension, score: 4, positiveEvidence: [{ reason: "具体段落证据" }], failureEvidence: [] })));
    expect(Object.keys(review.scores)).toHaveLength(evidence.length);
  });

  it("keeps quotas as warnings rather than generation instructions", () => {
    expect(courseGenerationPrompts.LANGUAGE_MAP.text).not.toMatch(/5-8|5～8|固定数量/);
    expect(courseGenerationPrompts.PERFORMANCE.text).not.toMatch(/4-7|4～7|固定数量/);
    expect(courseGenerationPrompts.SCRIPT_DRAFT.text).toContain("quotas");
    expect(courseGenerationPrompts.CRITIC.text).toContain("evidence");
  });
});
