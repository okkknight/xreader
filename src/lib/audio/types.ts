export type SynthesisInput = {
  text: string;
  referenceId: string;
  idempotencyKey: string;
  prosody?: { speed?: number; volume?: number };
};

export type SynthesisResult = {
  bytes: Uint8Array;
  providerRequestId?: string;
};

export interface TTSProvider {
  synthesize(input: SynthesisInput): Promise<SynthesisResult>;
}

export type AudioOwner = {
  articleId: string;
  ownerId: string;
  ownerType: "SENTENCE" | "PARAGRAPH_GUIDE";
};
