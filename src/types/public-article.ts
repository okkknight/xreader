export type PublicAnnotation = { id: string; text: string; meaningZh: string; noteZh: string | null; exampleEn: string | null };
export type PublicSentence = { id: string; text: string; translationZh: string | null; annotations: PublicAnnotation[]; audioPath: string | null; audioStatus: string };
export type PublicParagraph = { id: string; text: string; sentences: PublicSentence[] };
export type PublicSentenceGuide = {
  id: string;
  paragraphId: string;
  sentenceId: string;
  order: number;
  depth: "QUICK" | "NORMAL" | "DEEP";
  originalReadText: string;
  meaningZh: string;
  sentenceFunction: string;
  primaryTeachingGoal: string;
  focusScript: string | null;
  bridgeScript: string | null;
  estimatedStartMs: number | null;
  estimatedEndMs: number | null;
};
export type PublicParagraphGuide = {
  id: string;
  paragraphId: string;
  order: number;
  paragraphGoal: string;
  openingBridge: string | null;
  paragraphWrap: string | null;
  nextParagraphBridge: string | null;
  scriptText: string;
  sentenceGuides: PublicSentenceGuide[];
  audioPath: string | null;
  audioStatus: string;
  audioDurationMs: number | null;
};
export type PublicArticle = {
  id: string; slug: string; titleEn: string; titleZh: string; dekZh: string | null; topic: string; difficulty: string;
  paragraphs: PublicParagraph[]; paragraphGuides: PublicParagraphGuide[];
};
