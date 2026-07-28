import type { PipelineStep } from "../provider";

export type PromptDefinition = { version: string; text: string };

const instruction = "Return only a JSON object. Preserve stable IDs where the input provides them.";

export const prompts: Record<PipelineStep, PromptDefinition> = {
  FACT_CARD: { version: "fact-card/v1", text: `Extract attributable facts and source caveats. ${instruction}` },
  ARTICLE_WRITER: { version: "article-writer/v1", text: `Write an English learner article. Return titleEn, titleZh, topic, difficulty, bodyText. ${instruction}` },
  ARTICLE_EDITOR: { version: "article-editor/v1", text: `Edit the proposed article for accuracy and B1-B2 clarity. ${instruction}` },
  SENTENCE_SPLITTER: { version: "sentence-splitter/v1", text: `Split article text into paragraphs and stable sentences. ${instruction}` },
  ARTICLE_ANALYZER: { version: "article-analyzer/v1", text: `Provide learning analysis and annotations grounded in the article. ${instruction}` },
  TEACHING_DIRECTOR: { version: "teaching-director/v1", text: `Create a lesson plan that maps every reading segment to sentence IDs. ${instruction}` },
  SCRIPT_WRITER: { version: "script-writer/v1", text: `Write a teacher script from the lesson plan. ${instruction}` },
  SCRIPT_EDITOR: { version: "script-editor/v1", text: `Edit the lesson script; retain all sentence mappings. ${instruction}` },
  QA_REVIEW: { version: "qa-review/v1", text: `Report structured content and mapping issues. ${instruction}` },
};
