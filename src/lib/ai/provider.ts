export type PipelineStep =
  | "FACT_CARD"
  | "ARTICLE_WRITER"
  | "ARTICLE_EDITOR"
  | "SENTENCE_SPLITTER"
  | "ARTICLE_ANALYZER"
  | "TEACHING_DIRECTOR"
  | "SCRIPT_WRITER"
  | "SCRIPT_EDITOR"
  | "QA_REVIEW";

export type StructuredGenerationRequest = {
  step: PipelineStep;
  prompt: string;
  model?: string;
  input: unknown;
};

export interface LLMProvider {
  generateStructured<T>(request: StructuredGenerationRequest): Promise<T>;
}
