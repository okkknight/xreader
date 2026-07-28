import type { CourseImport } from "@/types/article";

const paragraphs = [
  ["People often notice the smell of rain before the first drop reaches the ground.", "That familiar scent has a name: petrichor.", "The word joins Greek roots for stone and a fluid once linked to the earth.", "It describes a real mixture rather than one single perfume."],
  ["It appears when dry soil, plants, and tiny organisms release compounds into the air.", "Rain carries those compounds upward as small droplets hit the ground.", "The droplets can burst and make a fine spray.", "That spray gives the scent a route into the air around you."],
  ["One important compound is made by soil bacteria.", "It is called geosmin.", "Humans are unusually sensitive to it, even at very low levels.", "That sensitivity may explain why a light shower can seem surprisingly noticeable."],
  ["Another part comes from oils that plants leave on dry surfaces.", "Those oils build up during dry weather.", "After a long dry spell, the first rain can release more of them at once.", "A sudden summer shower may therefore smell stronger than steady rain."],
  ["The smell is not exactly the same in every place.", "Temperature changes how quickly compounds move through the air.", "Wind decides whether they reach you or drift away.", "Soil and local plants add their own small signature."],
  ["So the next time rain seems to have a smell, you are noticing a small weather story.", "The air is carrying evidence of a dry landscape meeting water again.", "It is a sensory clue about what was on the ground before the rain began.", "That is why the same weather can feel different in two nearby places."],
];

const sentenceIds = paragraphs.flatMap((_, paragraphIndex) => [
  `seed-rain-p${String(paragraphIndex + 1).padStart(2, "0")}-s01`,
  `seed-rain-p${String(paragraphIndex + 1).padStart(2, "0")}-s02`,
]);

export const seedCourse: CourseImport = {
  article: {
    id: "seed-rain",
    slug: "why-rain-has-a-smell",
    titleEn: "Why Does Rain Have a Smell?",
    titleZh: "为什么雨有一种特别的气味？",
    dekZh: "从干燥的土地到第一滴雨，空气里发生了什么。",
    topic: "Nature & Science",
    difficulty: "B1-B2",
    status: "PUBLISHED",
    publishedAt: new Date("2026-07-28T00:00:00.000Z"),
  },
  paragraphs: paragraphs.map((sentences, paragraphIndex) => ({
    id: `seed-rain-p${String(paragraphIndex + 1).padStart(2, "0")}`,
    order: paragraphIndex + 1,
    text: sentences.join(" "),
    sentences: sentences.map((text, sentenceIndex) => ({
      id: `seed-rain-p${String(paragraphIndex + 1).padStart(2, "0")}-s${String(sentenceIndex + 1).padStart(2, "0")}`,
      order: sentenceIndex + 1,
      text,
    })),
  })),
  lessonSegments: [
    { id: "seed-rain-seg-01", order: 1, type: "OPENING", voiceRole: "TEACHER", sentenceIds: [sentenceIds[0]], script: "今天我们从一种很日常的气味开始。" },
    { id: "seed-rain-seg-02", order: 2, type: "ARTICLE_READ", voiceRole: "READER", sentenceIds: sentenceIds.slice(0, 2) },
    { id: "seed-rain-seg-03", order: 3, type: "QUICK_EXPLANATION", voiceRole: "TEACHER", sentenceIds: sentenceIds.slice(0, 2), script: "先记住 petrichor 这个名字。" },
    { id: "seed-rain-seg-04", order: 4, type: "ARTICLE_READ", voiceRole: "READER", sentenceIds: sentenceIds.slice(2, 6) },
    { id: "seed-rain-seg-05", order: 5, type: "DEEP_EXPLANATION", voiceRole: "TEACHER", sentenceIds: sentenceIds.slice(2, 6), script: "这里的重点不是逐个术语，而是雨如何把信息送到空气里。" },
    { id: "seed-rain-seg-06", order: 6, type: "ARTICLE_READ", voiceRole: "READER", sentenceIds: sentenceIds.slice(6, 10) },
    { id: "seed-rain-seg-07", order: 7, type: "CONTEXT_CONNECTION", voiceRole: "TEACHER", sentenceIds: sentenceIds.slice(6, 10), script: "前面是气味的来源，现在看为什么每场雨闻起来不同。" },
    { id: "seed-rain-seg-08", order: 8, type: "FINAL_WRAP", voiceRole: "TEACHER", sentenceIds: sentenceIds.slice(10), script: "雨的气味，是土地和水重新相遇的证据。" },
  ],
  annotations: [
    {
      id: "seed-rain-annotation-petrichor",
      sentenceId: "seed-rain-p01-s02",
      startOffset: 31,
      endOffset: 40,
      text: "petrichor",
      meaningZh: "雨后泥土与植物混合的气味",
      noteZh: "这里是给这种熟悉气味命名，而不是指某一种香味。",
      exampleEn: "Petrichor is strongest after a long dry spell.",
    },
  ],
};
