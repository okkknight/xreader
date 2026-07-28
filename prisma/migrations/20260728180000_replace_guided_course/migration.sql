DROP TABLE IF EXISTS "LessonSegment";

CREATE TABLE "ParagraphGuide" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "articleId" TEXT NOT NULL,
  "paragraphId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "paragraphGoal" TEXT NOT NULL,
  "openingBridge" TEXT,
  "paragraphWrap" TEXT,
  "nextParagraphBridge" TEXT,
  "scriptText" TEXT NOT NULL,
  "audioPath" TEXT,
  "audioDurationMs" INTEGER,
  "audioStatus" TEXT NOT NULL DEFAULT 'MISSING',
  "textHash" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ParagraphGuide_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ParagraphGuide_paragraphId_fkey" FOREIGN KEY ("paragraphId") REFERENCES "Paragraph" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SentenceGuide" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "paragraphGuideId" TEXT NOT NULL,
  "paragraphId" TEXT NOT NULL,
  "sentenceId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "depth" TEXT NOT NULL,
  "originalReadText" TEXT NOT NULL,
  "meaningZh" TEXT NOT NULL,
  "sentenceFunction" TEXT NOT NULL,
  "primaryTeachingGoal" TEXT NOT NULL,
  "focusScript" TEXT,
  "bridgeScript" TEXT,
  "likelyMisunderstanding" TEXT,
  "expressionTarget" TEXT,
  "replayAfterExplanation" BOOLEAN NOT NULL DEFAULT false,
  "estimatedStartMs" INTEGER,
  "estimatedEndMs" INTEGER,
  CONSTRAINT "SentenceGuide_paragraphGuideId_fkey" FOREIGN KEY ("paragraphGuideId") REFERENCES "ParagraphGuide" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SentenceGuide_paragraphId_fkey" FOREIGN KEY ("paragraphId") REFERENCES "Paragraph" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SentenceGuide_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "Sentence" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ParagraphGuide_articleId_order_key" ON "ParagraphGuide"("articleId", "order");
CREATE UNIQUE INDEX "ParagraphGuide_articleId_paragraphId_key" ON "ParagraphGuide"("articleId", "paragraphId");
CREATE UNIQUE INDEX "SentenceGuide_paragraphGuideId_sentenceId_key" ON "SentenceGuide"("paragraphGuideId", "sentenceId");
CREATE UNIQUE INDEX "SentenceGuide_paragraphGuideId_order_key" ON "SentenceGuide"("paragraphGuideId", "order");
