export const TEACHER_VOICES = {
  active: {
    id: "a19fd22b105a423a8c5ae5294b0353df",
    name: "三三英语老师",
  },
  backup: {
    id: "94b5db0e6aab4bec9ce843a3c486bf8e",
    name: "双语",
  },
} as const;

export const READER_VOICES = {
  active: {
    id: "76fcd904aa4b4a47af107686abd68248",
    name: "Godsplan 英文朗读",
  },
} as const;

export const ACTIVE_TEACHER_PERFORMANCE = {
  direction: "[warm, lively, and curious, but never exaggerated]",
  temperature: 0.58,
  prosody: { speed: 0.9 },
} as const;

export const ACTIVE_READER_PERFORMANCE = {
  temperature: 0.9,
  prosody: { speed: 0.9, volume: 1.5 },
} as const;
