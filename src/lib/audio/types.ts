export type SynthesisInput = {
  text: string;
  referenceId: string;
  idempotencyKey: string;
  prosody?: { speed?: number; volume?: number };
  temperature?: number;
};

export type SynthesisResult = {
  bytes: Uint8Array;
  providerRequestId?: string;
};

export type SynthesisAlignmentSegment = { text: string; startMs: number; endMs: number };
export type TimestampedSynthesisResult = SynthesisResult & { alignment: SynthesisAlignmentSegment[] };

export interface TTSProvider {
  synthesize(input: SynthesisInput): Promise<SynthesisResult>;
}

export type AudioOwner = {
  articleId: string;
  ownerId: string;
  ownerType: "SENTENCE" | "COURSE_BLOCK";
};
