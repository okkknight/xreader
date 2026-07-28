import { z } from "zod";

const instruction = "Return only a JSON object. Preserve stable IDs exactly as provided.";

export const articleUnderstandingSchema = z.object({
  coreQuestion: z.string().min(1), coreAnswer: z.string().min(1), thesis: z.string().min(1), articleSummaryZh: z.string().min(1),
  argumentOrExplanationPath: z.array(z.object({ order: z.number().int().positive(), sentenceIds: z.array(z.string().min(1)).min(1), function: z.string().min(1), contribution: z.string().min(1) })).min(1),
  paragraphFunctions: z.array(z.object({ paragraphId: z.string().min(1), function: z.string().min(1), relationshipToPrevious: z.string().min(1), relationshipToNext: z.string().min(1) })).min(1),
  keyTurns: z.array(z.object({ sentenceIds: z.array(z.string().min(1)).min(1), type: z.enum(["TURN", "CAUSE", "EVIDENCE", "EXAMPLE", "LIMITATION", "CONCLUSION"]), explanation: z.string().min(1) })),
  authorTone: z.string().min(1), cautionAndLimits: z.array(z.string()), essentialBackground: z.array(z.string()), unnecessaryBackground: z.array(z.string()), keySentenceIds: z.array(z.string()),
});

export const narrativePlanSchema = z.object({
  openingHook: z.string().min(1), guidingQuestion: z.string().min(1), finalAnswer: z.string().min(1), narrativeArc: z.string().min(1),
  stages: z.array(z.object({ id: z.string().min(1), order: z.number().int().positive(), title: z.string().min(1), paragraphIds: z.array(z.string()), sentenceIds: z.array(z.string()), function: z.enum(["SETUP", "COMMON_VIEW", "CENTRAL_TURN", "MECHANISM", "EVIDENCE", "EXAMPLE", "LIMITATION", "IMPLICATION", "RESOLUTION"]), contentProgress: z.object({ listenerQuestionBefore: z.string().min(1), listenerUnderstandingAfter: z.string().min(1), unresolvedQuestionAfter: z.string().optional() }), languageOpportunity: z.object({ possibleLearningPointIds: z.array(z.string()), languageFunction: z.string().min(1) }), listenerQuestionBefore: z.string().min(1).optional(), listenerUnderstandingAfter: z.string().min(1).optional(), unresolvedQuestionAfter: z.string().optional(), teachingPriority: z.string().min(1), energy: z.enum(["LIGHT", "MEDIUM", "HEAVY"]) })).min(1),
  rhythmPeaks: z.array(z.object({ stageId: z.string().min(1), sentenceIds: z.array(z.string()), reason: z.string().min(1) })),
  callbacks: z.array(z.object({ fromStageId: z.string().min(1), toStageId: z.string().min(1), idea: z.string().min(1) })),
});

export const sentenceAnalysisSchema = z.array(z.object({
  sentenceId: z.string().min(1), paragraphId: z.string().min(1), order: z.number().int().positive(), originalText: z.string().min(1), meaningZh: z.string().min(1), contentFunction: z.string().min(1).optional(), sentenceFunction: z.string().min(1).optional(), contentDepth: z.enum(["QUICK", "NORMAL", "DEEP"]).optional(), depth: z.enum(["QUICK", "NORMAL", "DEEP"]).optional(), mustReadAloud: z.boolean(), languageCandidates: z.array(z.object({ category: z.enum(["PHRASE", "COLLOCATION", "SENTENCE_PATTERN", "DISCOURSE", "REFERENCE", "TONE", "ELLIPSIS", "RHYTHM"]), target: z.string().min(1), value: z.enum(["LOW", "MEDIUM", "HIGH"]), reason: z.string().min(1) })).optional(), likelyMisunderstanding: z.string().optional(), teachingValue: z.object({ type: z.enum(["EXPRESSION", "STRUCTURE", "LOGIC", "REFERENCE", "TONE", "NONE"]), target: z.string().optional(), reason: z.string().optional() }).optional(), relationshipToPrevious: z.string().min(1), relationshipToNext: z.string().min(1),
})).min(1);

export const languageLearningMapSchema = z.array(z.object({
  id: z.string().min(1), sentenceIds: z.array(z.string()).min(1), category: z.enum(["PHRASE", "COLLOCATION", "SENTENCE_PATTERN", "DISCOURSE", "REFERENCE", "TONE", "ELLIPSIS", "RHYTHM"]), target: z.string().min(1), meaningInContext: z.string().min(1), functionInArticle: z.string().min(1), whyWorthLearning: z.string().min(1), transferValue: z.string().min(1), likelyLearnerProblem: z.string().min(1), teachingDepth: z.enum(["LIGHT", "MEDIUM", "DEEP"]), contrastOrClarification: z.string().optional(), exampleEn: z.string().optional(), callbackSentenceIds: z.array(z.string()).optional(),
})).min(1);

export const lessonDesignRationaleSchema = z.object({
  learnerObstacles: z.array(z.string().min(1)).min(1),
  highestValueLanguageOpportunities: z.array(z.string().min(1)).min(1),
  complexButLowValueMaterial: z.array(z.string()),
  groupingDecisions: z.array(z.object({ sentenceIds: z.array(z.string()).min(1), reason: z.string().min(1) })).min(1),
  slowDownDecisions: z.array(z.object({ sentenceIds: z.array(z.string()).min(1), reason: z.string().min(1) })),
  speedThroughDecisions: z.array(z.object({ sentenceIds: z.array(z.string()).min(1), reason: z.string().min(1) })),
  rhythmRisks: z.array(z.string().min(1)),
  teacherJudgmentNeeded: z.array(z.string().min(1)).min(1),
  contentOutcome: z.string().min(1),
  languageOutcome: z.string().min(1),
  whyNotCopyGoldStructure: z.string().min(1),
  cognitiveLoadRisk: z.string().min(1),
});

export const teachingBeatPlanSchema = z.array(z.object({
  id: z.string().min(1), stageId: z.string().min(1), order: z.number().int().positive(), sentenceIds: z.array(z.string()).min(1), contentGoal: z.string().min(1).optional(), languageGoal: z.object({ learningPointIds: z.array(z.string()), learnerShouldNotice: z.string().min(1), learnerShouldUnderstand: z.string().min(1) }).optional(), teacherMove: z.enum(["CONTENT_FLOW", "CONTENT_LANGUAGE_BLEND", "LANGUAGE_SPOTLIGHT", "CONTRAST_AND_REPLAY", "FAST_PASSAGE"]).optional(), rhetoricalFunction: z.enum(["SETUP", "DESCRIPTION", "COMMON_VIEW", "CONTRAST", "TURN", "CAUSE", "EXPLANATION", "EXAMPLE", "EVIDENCE", "LIST", "LIMITATION", "IMPLICATION", "CONCLUSION"]), narrativeGoal: z.string().min(1).optional(), listenerQuestionBefore: z.string().optional(), listenerUnderstandingAfter: z.string().min(1), deliveryPattern: z.string().min(1), spotlightSentenceIds: z.array(z.string()), contentToClarify: z.array(z.string()).optional(), contentNotToOverExplain: z.array(z.string()).optional(), relationshipToPreviousBeat: z.string().min(1).optional(), relationshipToNextBeat: z.string().min(1).optional(), energy: z.enum(["LIGHT", "MEDIUM", "HEAVY"]), targetDurationSeconds: z.number().positive().optional(),
})).min(1);

export const teacherPerformancePlanSchema = z.object({
  moves: z.array(z.object({ id: z.string().min(1), type: z.enum(["MAKE_A_CHOICE", "ANTICIPATE_CONFUSION", "CALL_BACK", "COMPARE_EXPRESSIONS", "NOTICE_TONE", "REPLAY_WITH_PURPOSE", "LIGHT_REACTION", "SKIP_EXPLICITLY"]), beatId: z.string().min(1), sentenceIds: z.array(z.string()).min(1), purpose: z.string().min(1), mustAvoid: z.string().min(1) })).min(1),
});

const scriptBeatSchema = z.object({ beatId: z.string().min(1), sentenceIds: z.array(z.string()).min(1), scriptText: z.string().min(1), readOccurrences: z.array(z.object({ sentenceId: z.string().min(1), exactOriginalText: z.string().min(1), occurrenceOrder: z.number().int().positive() })).min(1), spotlightSentenceIds: z.array(z.string()), estimatedSeconds: z.number().nonnegative() });
export const fullScriptSchema = z.object({
  openingScript: z.string().min(1), stages: z.array(z.object({ stageId: z.string().min(1), stageEntryScript: z.string().optional(), beats: z.array(scriptBeatSchema).min(1), stageExitScript: z.string().optional() })).min(1), finalWrapScript: z.string().min(1), fullScriptText: z.string().min(1), sentenceCoverage: z.array(z.object({ sentenceId: z.string().min(1), coveredByBeatId: z.string().min(1), readAloud: z.boolean(), meaningCovered: z.boolean(), coverageExplanation: z.string().min(1) })).min(1), expressionsTaught: z.array(z.string()), ideasExplained: z.array(z.string()), estimatedTotalSeconds: z.number().nonnegative(),
});

export const qualityReviewSchema = z.object({ blocking: z.boolean(), scores: z.object({ factualFidelity: z.number().min(1).max(5), sentenceCoverage: z.number().min(1).max(5), articleNarrative: z.number().min(1).max(5), teachingBeatQuality: z.number().min(1).max(5), rhythmVariation: z.number().min(1).max(5), spokenNaturalness: z.number().min(1).max(5), teacherConsistency: z.number().min(1).max(5), informationDensity: z.number().min(1).max(5), nonTemplateQuality: z.number().min(1).max(5) }), issues: z.array(z.object({ severity: z.enum(["BLOCKER", "MAJOR", "MINOR"]), stageId: z.string().optional(), beatId: z.string().optional(), sentenceIds: z.array(z.string()).optional(), problem: z.string().min(1), suggestedAction: z.string().min(1) })), globalDiagnosis: z.string().min(1) });

export const finalQualityReviewSchema = z.object({
  blocking: z.boolean(),
  scores: z.object({ factualFidelity: z.number().min(1).max(5), sentenceCoverage: z.number().min(1).max(5), contentUnderstanding: z.number().min(1).max(5), articleNarrative: z.number().min(1).max(5), languageLearningValue: z.number().min(1).max(5), transferValue: z.number().min(1).max(5), languagePointSelection: z.number().min(1).max(5), articleLanguageIntegration: z.number().min(1).max(5), teacherPresence: z.number().min(1).max(5), humanNaturalness: z.number().min(1).max(5), rhythmVariation: z.number().min(1).max(5), spokenNaturalness: z.number().min(1).max(5), nonTemplateQuality: z.number().min(1).max(5) }),
  issues: z.array(z.object({ severity: z.enum(["BLOCKER", "MAJOR", "MINOR"]), beatIds: z.array(z.string()).optional(), sentenceIds: z.array(z.string()).optional(), problem: z.string().min(1), requiredAction: z.string().min(1) })),
});

const qualityEvidenceSchema = z.object({
  dimension: z.string().min(1), score: z.number().min(1).max(5),
  positiveEvidence: z.array(z.object({ stageId: z.string().optional(), beatId: z.string().optional(), sentenceIds: z.array(z.string()).optional(), excerpt: z.string().optional(), reason: z.string().min(1) })),
  failureEvidence: z.array(z.object({ stageId: z.string().optional(), beatId: z.string().optional(), sentenceIds: z.array(z.string()).optional(), excerpt: z.string().optional(), reason: z.string().min(1), requiredChange: z.string().min(1) })),
});

export const instructionalQualityReviewSchema = z.object({
  blocking: z.boolean(),
  scores: z.object({ contentUnderstanding: z.number().min(1).max(5), languageLearningValue: z.number().min(1).max(5), contentLanguageIntegration: z.number().min(1).max(5), instructionalNecessity: z.number().min(1).max(5), languagePointSelection: z.number().min(1).max(5), depthMatching: z.number().min(1).max(5), cognitiveLoadControl: z.number().min(1).max(5), teacherJudgment: z.number().min(1).max(5), articleRhythm: z.number().min(1).max(5), spokenNaturalness: z.number().min(1).max(5), nonTemplateQuality: z.number().min(1).max(5) }),
  issues: z.array(z.object({ severity: z.enum(["BLOCKER", "MAJOR", "MINOR"]), stageId: z.string().optional(), beatId: z.string().optional(), sentenceIds: z.array(z.string()).optional(), problem: z.string().min(1), requiredAction: z.string().min(1) })),
});

export const qualityEvidenceListSchema = z.array(qualityEvidenceSchema);
export const calibrationNotesSchema = z.array(z.object({ observation: z.string().min(1), whyNotAcceptable: z.string().min(1), change: z.string().min(1), standardDimension: z.string().min(1), futurePrevention: z.string().min(1) }));

export const courseGenerationPromptInstruction = instruction;
