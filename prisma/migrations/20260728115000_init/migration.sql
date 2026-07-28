-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleZh" TEXT NOT NULL,
    "dekZh" TEXT,
    "topic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'B1-B2',
    "status" TEXT NOT NULL DEFAULT 'IDEA',
    "bodyText" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "estimatedReadMs" INTEGER,
    "publishedAt" DATETIME,
    "scheduledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Paragraph" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "Paragraph_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sentence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paragraphId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "translationZh" TEXT,
    "startOffset" INTEGER,
    "endOffset" INTEGER,
    CONSTRAINT "Sentence_paragraphId_fkey" FOREIGN KEY ("paragraphId") REFERENCES "Paragraph" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "publisher" TEXT,
    "url" TEXT NOT NULL,
    "publishedAt" DATETIME,
    "accessedAt" DATETIME,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "ArticleSource" (
    "articleId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "factNotes" JSONB,

    PRIMARY KEY ("articleId", "sourceId"),
    CONSTRAINT "ArticleSource_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ArticleSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArticleAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "promptVer" TEXT NOT NULL,
    "model" TEXT,
    "data" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ArticleAnalysis_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LessonPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "promptVer" TEXT NOT NULL,
    "model" TEXT,
    "data" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LessonPlan_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LessonSegment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "primaryGoal" TEXT,
    "script" TEXT,
    "voiceRole" TEXT NOT NULL,
    "sentenceIds" JSONB NOT NULL,
    "highlightMode" TEXT,
    "autoScrollTarget" TEXT,
    "pauseBeforeMs" INTEGER NOT NULL DEFAULT 0,
    "pauseAfterMs" INTEGER NOT NULL DEFAULT 400,
    "replaySourceSegmentId" TEXT,
    "audioPath" TEXT,
    "audioDurationMs" INTEGER,
    "audioStatus" TEXT NOT NULL DEFAULT 'MISSING',
    "textHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LessonSegment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Annotation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sentenceId" TEXT NOT NULL,
    "startOffset" INTEGER NOT NULL,
    "endOffset" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "meaningZh" TEXT NOT NULL,
    "noteZh" TEXT,
    "exampleEn" TEXT,
    "audioPath" TEXT,
    CONSTRAINT "Annotation_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "Sentence" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AudioAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "voiceId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "textHash" TEXT NOT NULL,
    "providerRequestId" TEXT,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GenerationJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "promptVer" TEXT,
    "model" TEXT,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GenerationJob_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArticleFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "difficulty" TEXT,
    "density" TEXT,
    "worthReading" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArticleFeedback_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Paragraph_articleId_order_key" ON "Paragraph"("articleId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Sentence_paragraphId_order_key" ON "Sentence"("paragraphId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleAnalysis_articleId_key" ON "ArticleAnalysis"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonPlan_articleId_key" ON "LessonPlan"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonSegment_articleId_order_key" ON "LessonSegment"("articleId", "order");

-- CreateIndex
CREATE INDEX "AudioAsset_ownerType_ownerId_idx" ON "AudioAsset"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "ArticleFeedback_articleId_createdAt_idx" ON "ArticleFeedback"("articleId", "createdAt");

