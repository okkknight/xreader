export type PublicAnnotation = { id: string; text: string; meaningZh: string; noteZh: string | null; exampleEn: string | null };
export type PublicSentence = { id: string; text: string; translationZh: string | null; annotations: PublicAnnotation[] };
export type PublicParagraph = { id: string; text: string; sentences: PublicSentence[] };
export type PublicSegment = { id: string; order: number; type: string; script: string | null; sentenceIds: string[]; audioPath: string | null; audioStatus: string };
export type PublicArticle = {
  id: string; slug: string; titleEn: string; titleZh: string; dekZh: string | null; topic: string; difficulty: string;
  paragraphs: PublicParagraph[]; lessonSegments: PublicSegment[];
};
