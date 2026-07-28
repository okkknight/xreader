CREATE TABLE "CourseScriptGeneration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "currentStage" TEXT,
    "promptVersion" TEXT NOT NULL,
    "model" TEXT,
    "inputHash" TEXT NOT NULL,
    "articleUnderstanding" JSONB,
    "narrativePlan" JSONB,
    "sentenceAnalysis" JSONB,
    "teachingBeatPlan" JSONB,
    "fullScriptDraft" JSONB,
    "editedScript" JSONB,
    "qualityReview" JSONB,
    "repairHistory" JSONB,
    "finalScript" JSONB,
    "manuallyEdited" BOOLEAN NOT NULL DEFAULT false,
    "parentVersionId" TEXT,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "CourseScriptGeneration_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CourseScriptGeneration_articleId_version_key" ON "CourseScriptGeneration"("articleId", "version");
CREATE INDEX "CourseScriptGeneration_articleId_createdAt_idx" ON "CourseScriptGeneration"("articleId", "createdAt");
