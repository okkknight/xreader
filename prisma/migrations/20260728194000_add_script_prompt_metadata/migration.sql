ALTER TABLE "CourseScriptGeneration" ADD COLUMN "promptVersions" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "CourseScriptGeneration" ADD COLUMN "temperature" REAL;
