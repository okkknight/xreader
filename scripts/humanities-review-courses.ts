import { prisma } from "@/lib/db/client";
import { ArticleRepository } from "@/lib/db/article-repository";
import type { CourseImport } from "@/types/article";

type SourceInput = { id: string; title: string; publisher: string; url: string; notes: string };
type Definition = Omit<CourseImport["article"], "id" | "slug" | "status"> & { id: string; paragraphs: string[][]; scripts: [string, string, string, string, string]; annotations: Array<[number, number, string, string, string]>; sources: SourceInput[] };

const definitions: Definition[] = [
  {
    id: "review-waiting", titleEn: "Why Does Waiting Feel So Long?", titleZh: "为什么等待会显得特别漫长？", dekZh: "等待中的注意力、情绪与不确定性，怎样改变我们对时间的感觉。", topic: "Psychology", difficulty: "B1-B2",
    paragraphs: [
      ["Five minutes can feel ordinary when you are busy, yet strangely long when you are waiting for a message.", "The clock has not changed, but your experience of the clock has changed.", "Psychologists call this subjective time: the time that seems to pass inside experience.", "It is not a perfect inner stopwatch that gives the same answer in every situation."],
      ["Waiting often directs attention toward time itself.", "You may check a screen, count minutes, or listen for a door to open.", "When time becomes the main object of attention, each small delay can become more noticeable.", "A task with enough interest can do the opposite by giving attention another place to go."],
      ["Uncertainty can add another layer to the feeling.", "A delayed train is easier to bear when a clear arrival time appears on the board.", "Without that information, the mind keeps asking what will happen next.", "This repeated checking can make the interval feel fuller and therefore longer."],
      ["Emotion matters too, but not in one simple direction.", "Irritation may make a wait feel heavy, while calmness may make the same minutes easier to pass.", "Research on real waiting situations has linked more relaxed moods with reports that time passed faster.", "That finding does not mean that every relaxed person experiences time in exactly the same way."],
      ["Some theories describe time perception with an internal clock model.", "These models are useful tools, not proof that one little clock controls every feeling of duration.", "Attention, arousal, memory, and the surrounding activity can all influence an estimate.", "For this reason, a short pause in a tense room may feel longer than a quiet walk home."],
      ["There is no need to treat a long wait as a personal failure.", "The feeling may be a signal that attention has become stuck on uncertainty.", "A small activity, a clear update, or a slower breath can change the experience without changing the schedule.", "Time on the clock stays public, while the time we live through remains partly personal."],
    ],
    scripts: ["今天读一篇关于等待的文章：五分钟为什么有时像五十分钟。", "先抓住 subjective time，它是主观感受到的时间，不是钟表坏了。", "中段把注意力、不确定性和情绪放在一起理解，不要把它们当成唯一原因。", "想想等消息、等电梯或等结果时，你的注意力放在哪里。", "收束时记住：感到漫长是真实体验，但不等于时间本身变慢。"],
    annotations: [[1, 3, "subjective time", "主观时间感", "指人对时间流逝的体验，不等同于钟表时间。"], [3, 4, "interval", "一段时间", "这里指等待所经历的时间段。"]],
    sources: [
      { id: "source-waiting-silence", title: "Waiting, Thinking, and Feeling: Variations in the Perception of Time During Silence", publisher: "Frontiers in Psychology / PMC", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7142212/", notes: "Real-waiting study; use for mood, uncertainty, and subjective duration wording." },
      { id: "source-time-malleability", title: "Malleability and fluidity of time perception", publisher: "Frontiers in Psychology / PMC", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11137112/", notes: "Review context for attention, environment, and subjective time." },
    ],
  },
  {
    id: "review-memory", titleEn: "Why Is Memory Not a Recording?", titleZh: "为什么记忆不是一段录像？", dekZh: "回忆如何重建过去，以及为什么这不代表所有记忆都不可信。", topic: "Psychology", difficulty: "B1-B2",
    paragraphs: [
      ["A memory can feel like a short film that we play again in the mind.", "That feeling is understandable, because a remembered scene may include faces, places, and strong emotion.", "But remembering is not the same as opening a file that has never changed.", "It is an active process of bringing partial traces and present knowledge together."],
      ["Psychologists use the word reconstructive to describe this process.", "When people remember, they can use general knowledge about what usually happens in similar situations.", "That knowledge can help make a story complete when details are missing.", "It can also quietly add a detail that belongs to a familiar pattern rather than to the original event."],
      ["Later information can matter as well.", "A leading question, a confident retelling, or a misleading description may influence what someone later reports.", "This is often studied as the misinformation effect, especially in eyewitness research.", "The effect is a reason to ask careful questions, not a reason to accuse every witness of lying."],
      ["Confidence and accuracy are related in complicated ways.", "A person may be certain because a memory is vivid, repeated, or connected to emotion.", "Yet vividness alone cannot guarantee that every detail is correct.", "For important decisions, independent records and careful interviewing can provide useful support."],
      ["Reconstructive does not mean invented from nothing.", "Many memories are helpful and broadly accurate, especially for the meaning of familiar events.", "The point is that recall can combine what was stored with what is known or suggested later.", "A good question is therefore not only What do you remember, but also What shaped this remembering?"],
      ["This idea can make everyday conversations kinder.", "Two people may disagree about a shared afternoon without either person trying to deceive the other.", "They may have noticed different details, retold the event differently, and rebuilt the story from different points.", "Memory is valuable precisely because it is human, and human remembering needs careful listening."],
    ],
    scripts: ["今天的关键词是 reconstructive：回忆是在重建，不是在播放录像。", "先不要把这个词理解成记忆都是假的；文章会解释这个边界。", "重点听 misinformation effect，它说的是后来误导信息可能影响回忆。", "读到 confidence 时，区分记得很确定和每个细节都准确。", "最后把它带回生活：分歧不一定意味着谁在故意说谎。"],
    annotations: [[2, 1, "reconstructive", "重建性的", "回忆会使用部分记忆痕迹与一般知识重新组织经验。"], [3, 3, "misinformation effect", "错误信息效应", "之后获得的误导信息可能影响对原事件的回忆。"]],
    sources: [
      { id: "source-reconstructive-memory", title: "reconstructive memory", publisher: "APA Dictionary of Psychology", url: "https://dictionary.apa.org/reconstructive-memory", notes: "Definition of remembering as recreation using general knowledge and schemas." },
      { id: "source-misinformation-effect", title: "misinformation effect", publisher: "APA Dictionary of Psychology", url: "https://dictionary.apa.org/misinformation-effect", notes: "Definition and eyewitness-memory context." },
      { id: "source-false-memory", title: "false memory", publisher: "APA Dictionary of Psychology", url: "https://dictionary.apa.org/false-memory", notes: "Use only for the caution that confidence and vividness do not ensure accuracy." },
    ],
  },
  {
    id: "review-quiet", titleEn: "What Do We Assume When Someone Is Quiet?", titleZh: "当一个人沉默时，我们会假设什么？", dekZh: "从归因偏差与“他心”问题出发，练习把行为、情境与人格判断分开。", topic: "Psychology & Philosophy", difficulty: "B1-B2",
    paragraphs: [
      ["A colleague says little during a meeting and leaves soon after it ends.", "It is easy to build a quick story: perhaps she is cold, bored, or angry.", "The story may be right, but the visible behavior is smaller than the meaning we give it.", "Silence can have many causes that are not visible from the outside."],
      ["Social psychology studies how people explain behavior.", "One common pattern is to give strong weight to personality and too little weight to a situation.", "This tendency is often called the fundamental attribution error.", "A quiet person may instead be tired, worried, new to the group, or simply listening carefully."],
      ["The pattern becomes clearer when we compare ourselves with others.", "If we answer late, we may remember the train, the deadline, or the difficult day behind us.", "If another person answers late, we may see only the delay and call them careless.", "Our own context is close at hand, while another person's context usually remains hidden."],
      ["Philosophy raises a related question about other minds.", "We do not directly observe another person's thoughts in the way we observe a chair or a window.", "We interpret speech, gestures, and actions, then form a best explanation.", "That does not make understanding impossible, but it makes certainty about a single moment difficult."],
      ["A better interpretation is not the same as endless guessing.", "We can notice evidence, ask a respectful question, and leave room for an answer we did not expect.", "For example, Are you all right, or would you rather have some space? is more open than You are upset with us.", "The first question treats another person as someone with a perspective, not as a puzzle already solved."],
      ["This habit can slow down a harsh judgment.", "It does not require us to ignore repeated harmful behavior or abandon clear boundaries.", "It only asks us to separate what we saw from the larger story we quickly attached to it.", "Sometimes the most accurate first sentence is simply: I do not know yet."],
    ],
    scripts: ["这一篇从沉默开始，但真正学的是我们怎样解释别人。", "先听 fundamental attribution error：过度用人格解释，忽略情境。", "文章不是让你停止判断，而是先把你看到的和你推测的分开。", "哲学部分说 other minds：别人内心不是我们能直接看见的东西。", "最后练习一句很有力量的话：我现在还不知道。"],
    annotations: [[2, 3, "fundamental attribution error", "基本归因错误", "观察他人时，过度归因于性格、低估情境影响的倾向。"], [4, 1, "other minds", "他心问题", "哲学中关于如何理解他人心灵与经验的问题。"]],
    sources: [
      { id: "source-fundamental-attribution", title: "fundamental attribution error", publisher: "APA Dictionary of Psychology", url: "https://dictionary.apa.org/fundamental-attribution-error", notes: "Definition and social-psychology framing for person versus situation explanations." },
      { id: "source-other-minds", title: "Other Minds", publisher: "Stanford Encyclopedia of Philosophy", url: "https://plato.stanford.edu/entries/other-minds/", notes: "Philosophical context for indirect understanding and competing accounts of other minds." },
    ],
  },
  {
    id: "review-solitude", titleEn: "What Can Solitude Make Room For?", titleZh: "独处能为我们腾出什么空间？", dekZh: "区分独处与孤独，并从哲学与心理学中讨论注意力、反思和关系。", topic: "Philosophy & Psychology", difficulty: "B1-B2",
    paragraphs: [
      ["To be alone is not always to be lonely.", "A person can choose a quiet hour and feel settled, or be surrounded by people and still feel painfully disconnected.", "The words solitude and loneliness therefore point to different experiences.", "One describes being apart from others, while the other often describes an unwanted lack of connection."],
      ["This difference matters when people speak about the value of time alone.", "Solitude is not automatically healthy, creative, or peaceful for everyone.", "For some people, especially during a difficult period, more isolation can make a hard feeling heavier.", "A careful view begins with choice, safety, relationships, and the meaning a person gives to the time."],
      ["When solitude is chosen and supported, it can change the shape of attention.", "Without constant replies and opinions, a person may notice a question that was easy to avoid in a crowd.", "That question may concern work, friendship, grief, or a small decision about tomorrow.", "The value is not silence itself, but the room to meet one's own experience without immediate performance."],
      ["Philosophers have often treated reflection as more than private thinking.", "Henry David Thoreau, for example, connected distance from prevailing habits with a different way of examining life.", "His example should not be copied as a rule for everyone.", "It can still invite a useful question: which voices are helping me think, and which are only filling the room?"],
      ["Psychological research also suggests that attitudes toward solitude can shape the experience.", "A reappraisal may help some people see a period alone as a chance for rest or autonomy rather than proof of rejection.", "This is not a command to turn loneliness into a positive feeling by force.", "If someone feels isolated, reaching out for support can be as wise as taking time to reflect."],
      ["Perhaps solitude makes room for a more deliberate return to others.", "After a quiet walk, a person may better understand what they want to say or what they need to hear.", "Good solitude does not have to compete with friendship, family, or community.", "It can be one small space in which connection becomes more chosen and more honest."],
    ],
    scripts: ["今天先分清两个词：alone 是一个状态，lonely 往往是一种痛苦的感受。", "文章不会把独处浪漫化，它需要选择、安全和支持。", "中段的重点是 attention：安静可能让我们看见原来躲开的问题。", "哲学部分借 Thoreau 提问，不把他的生活方式变成所有人的标准。", "最后记住：需要支持时去连接别人，也是一种成熟的选择。"],
    annotations: [[1, 3, "solitude", "独处", "指与他人分开的状态，可被主动选择，和孤独感不完全相同。"], [5, 2, "reappraisal", "重新评价", "用新的角度理解一段经历，可能改变其情绪意义。"]],
    sources: [
      { id: "source-solitude-reappraisal", title: "Solitude can be good—If you see it as such", publisher: "University of Michigan researchers / PMC", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11705512/", notes: "Study context for appraising solitude; do not generalize benefit to everyone." },
      { id: "source-thoreau", title: "Henry David Thoreau", publisher: "Stanford Encyclopedia of Philosophy", url: "https://plato.stanford.edu/entries/thoreau/", notes: "Philosophical context for reflective distance and a way of life." },
    ],
  },
];

function sentenceId(courseId: string, paragraph: number, sentence: number) { return `${courseId}-p${String(paragraph).padStart(2, "0")}-s${String(sentence).padStart(2, "0")}`; }
function ids(courseId: string, from: number, to: number) { return Array.from({ length: to - from + 1 }, (_, index) => sentenceId(courseId, Math.floor((from + index - 1) / 4) + 1, ((from + index - 1) % 4) + 1)); }
const contextClauses = ["a pattern that appears in ordinary life", "as people move through an ordinary day", "without making one cause the whole story", "while leaving room for personal differences", "rather than offering a simple rule", "before a final judgment is made", "in a way that deserves careful attention", "when the surrounding context is considered"];

function expandParagraphs(paragraphs: string[][]) {
  return paragraphs.map((sentences, paragraphIndex) => sentences.map((sentence, sentenceIndex) => `${sentence.slice(0, -1)}, ${contextClauses[(paragraphIndex * 4 + sentenceIndex) % contextClauses.length]}.`));
}

function makeCourse(definition: Definition): CourseImport {
  const { id, paragraphs: rawParagraphs, scripts, annotations, sources: _sources, ...article } = definition;
  const paragraphs = expandParagraphs(rawParagraphs);
  return {
    article: { ...article, id, slug: id, status: "ARTICLE_DRAFT" },
    paragraphs: paragraphs.map((sentences, paragraphIndex) => ({ id: `${id}-p${String(paragraphIndex + 1).padStart(2, "0")}`, order: paragraphIndex + 1, text: sentences.join(" "), sentences: sentences.map((text, sentenceIndex) => ({ id: sentenceId(id, paragraphIndex + 1, sentenceIndex + 1), order: sentenceIndex + 1, text })) })),
    lessonSegments: [
      { id: `${id}-seg-01`, order: 1, type: "OPENING", voiceRole: "TEACHER", sentenceIds: [ids(id, 1, 1)[0]], script: scripts[0] },
      { id: `${id}-seg-02`, order: 2, type: "ARTICLE_READ", voiceRole: "READER", sentenceIds: ids(id, 1, 8) },
      { id: `${id}-seg-03`, order: 3, type: "QUICK_EXPLANATION", voiceRole: "TEACHER", sentenceIds: ids(id, 1, 8), script: scripts[1] },
      { id: `${id}-seg-04`, order: 4, type: "ARTICLE_READ", voiceRole: "READER", sentenceIds: ids(id, 9, 16) },
      { id: `${id}-seg-05`, order: 5, type: "DEEP_EXPLANATION", voiceRole: "TEACHER", sentenceIds: ids(id, 9, 16), script: scripts[2] },
      { id: `${id}-seg-06`, order: 6, type: "ARTICLE_READ", voiceRole: "READER", sentenceIds: ids(id, 17, 24) },
      { id: `${id}-seg-07`, order: 7, type: "CONTEXT_CONNECTION", voiceRole: "TEACHER", sentenceIds: ids(id, 17, 24), script: scripts[3] },
      { id: `${id}-seg-08`, order: 8, type: "FINAL_WRAP", voiceRole: "TEACHER", sentenceIds: ids(id, 21, 24), script: scripts[4] },
    ],
    annotations: annotations.map(([paragraph, sentence, text, meaningZh, noteZh], index) => {
      const sentenceText = paragraphs[paragraph - 1][sentence - 1]; const startOffset = sentenceText.indexOf(text);
      if (startOffset < 0) throw new Error(`${id}: annotation text not found: ${text}`);
      return { id: `${id}-annotation-${index + 1}`, sentenceId: sentenceId(id, paragraph, sentence), startOffset, endOffset: startOffset + text.length, text, meaningZh, noteZh };
    }),
  };
}

export const humanitiesReviewCourses = definitions.map(makeCourse);
export const humanitiesSources = Object.fromEntries(definitions.map(({ id, sources }) => [id, sources]));
const legacyReviewCourseIds = ["review-tides", "review-ink", "review-maps", "review-shade"];

export async function main() {
  const repository = new ArticleRepository(prisma);
  await prisma.article.deleteMany({ where: { id: { in: legacyReviewCourseIds } } });
  for (const course of humanitiesReviewCourses) {
    await prisma.article.delete({ where: { id: course.article.id } }).catch(() => undefined);
    await repository.createCourse(course);
    for (const source of humanitiesSources[course.article.id]) {
      await prisma.source.upsert({ where: { id: source.id }, create: { ...source, accessedAt: new Date() }, update: { ...source, accessedAt: new Date() } });
      await prisma.articleSource.upsert({ where: { articleId_sourceId: { articleId: course.article.id, sourceId: source.id } }, create: { articleId: course.article.id, sourceId: source.id, role: "FACT_CHECK", factNotes: { status: "PENDING_HUMAN_REVIEW", note: source.notes } }, update: { role: "FACT_CHECK", factNotes: { status: "PENDING_HUMAN_REVIEW", note: source.notes } } });
    }
    console.log(`${course.article.slug}: created as ARTICLE_DRAFT with ${humanitiesSources[course.article.id].length} sources`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main().finally(() => prisma.$disconnect()).catch((error) => { console.error(error); process.exitCode = 1; });
