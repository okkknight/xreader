import type { CourseImport } from "@/types/article";

const paragraphs = [
  ["People often notice the smell of rain before the first drop reaches the ground.", "That familiar scent has a name: petrichor.", "The word joins Greek roots for stone and a fluid once linked to the earth.", "It describes a real mixture rather than one single perfume."],
  ["It appears when dry soil, plants, and tiny organisms release compounds into the air.", "Rain carries those compounds upward as small droplets hit the ground.", "The droplets can burst and make a fine spray.", "That spray gives the scent a route into the air around you."],
  ["One important compound is made by soil bacteria.", "It is called geosmin.", "Humans are unusually sensitive to it, even at very low levels.", "That sensitivity may explain why a light shower can seem surprisingly noticeable."],
  ["Another part comes from oils that plants leave on dry surfaces.", "Those oils build up during dry weather.", "After a long dry spell, the first rain can release more of them at once.", "A sudden summer shower may therefore smell stronger than steady rain."],
  ["The smell is not exactly the same in every place.", "Temperature changes how quickly compounds move through the air.", "Wind decides whether they reach you or drift away.", "Soil and local plants add their own small signature."],
  ["So the next time rain seems to have a smell, you are noticing a small weather story.", "The air is carrying evidence of a dry landscape meeting water again.", "It is a sensory clue about what was on the ground before the rain began.", "That is why the same weather can feel different in two nearby places."],
];

const sentenceId = (paragraph: number, sentence: number) => `seed-rain-p${String(paragraph).padStart(2, "0")}-s${String(sentence).padStart(2, "0")}`;
const paragraphIds = (paragraph: number) => [1, 2, 3, 4].map((sentence) => sentenceId(paragraph, sentence));

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
    sentences: sentences.map((text, sentenceIndex) => ({ id: sentenceId(paragraphIndex + 1, sentenceIndex + 1), order: sentenceIndex + 1, text })),
  })),
  lessonSegments: [
    { id: "seed-rain-seg-01", order: 1, type: "OPENING", voiceRole: "TEACHER", sentenceIds: [sentenceId(1, 1)], primaryGoal: "用熟悉的嗅觉经验提出文章问题", script: "你有没有注意过，雨还没真正落到身上，空气里已经先有味道了？它像是土地提前发来的一条消息。今天这篇文章不只是在告诉我们‘雨的味道叫什么’，而是在追问：这些气味原本藏在哪里，又是怎么来到我们鼻子前的？听的时候，留意作者怎样从一个熟悉的感觉，一步步走到一个具体的解释。" },
    { id: "seed-rain-seg-02", order: 2, type: "ORIENTATION", voiceRole: "TEACHER", sentenceIds: [sentenceId(1, 1)], primaryGoal: "建立全文三步结构", script: "文章会走三步。先给这个气味一个名字，再解释雨滴怎样把地面上的成分带进空气，最后说明为什么不同地方、不同天气闻起来不一样。我们不用把每个化学名词背下来，先抓住这条路线就够了。" },
    { id: "seed-rain-seg-03", order: 3, type: "ARTICLE_READ", voiceRole: "READER", sentenceIds: paragraphIds(1) },
    { id: "seed-rain-seg-04", order: 4, type: "QUICK_EXPLANATION", voiceRole: "TEACHER", sentenceIds: paragraphIds(1), primaryGoal: "把 petrichor 定位为现象名称而非单一物质", script: "先做一个快速确认：petrichor 只是这类气味的名字，不是一瓶固定配方的香水。文章马上还会告诉我们，里面可能混着来自土壤、植物和其他来源的不同成分。知道它是在命名现象，就可以继续往下读。" },
    { id: "seed-rain-seg-05", order: 5, type: "EXPRESSION_NOTE", voiceRole: "TEACHER", sentenceIds: [sentenceId(1, 1)], primaryGoal: "理解 before 引出的提前发生", script: "‘before the first drop reaches the ground’ 先注意 before。它把时间点放在第一滴雨落地之前，所以开头写的不是‘雨后才闻到’，而是气味已经先抵达了。这个结构以后也可以用来描述：某件事发生前，另一个信号已经出现。" },
    { id: "seed-rain-seg-06", order: 6, type: "ARTICLE_READ", voiceRole: "READER", sentenceIds: paragraphIds(2) },
    { id: "seed-rain-seg-07", order: 7, type: "DEEP_EXPLANATION", voiceRole: "TEACHER", sentenceIds: paragraphIds(2), primaryGoal: "解释气味从地面进入空气的传递机制", script: "这一段回答的是‘气味怎么到达我们这里’，不是在列化学成分。干燥的土壤、植物和微生物先留下可以释放的化合物。雨滴撞到地面时，会把很小的液滴和空气一起带起来。于是，原来贴近地面的气味有了进入周围空气的路径。注意作者用了 can 和 gives a route，说的是一种可能的传递机制，不是每一场雨都完全一样。" },
    { id: "seed-rain-seg-08", order: 8, type: "REPLAY", voiceRole: "READER", sentenceIds: [sentenceId(2, 2), sentenceId(2, 3), sentenceId(2, 4)], primaryGoal: "重听雨滴制造气味传播路径的连续动作" },
    { id: "seed-rain-seg-09", order: 9, type: "ARTICLE_READ", voiceRole: "READER", sentenceIds: paragraphIds(3) },
    { id: "seed-rain-seg-10", order: 10, type: "DEEP_EXPLANATION", voiceRole: "TEACHER", sentenceIds: paragraphIds(3), primaryGoal: "区分整体气味 petrichor 与具体成分 geosmin", script: "‘One important compound’ 这几个词很关键。作者举出 geosmin，是为了给解释一个具体例子，不是说雨的气味只来自 geosmin。接着文章说，人类在很低浓度下也能闻到它，所以一点点释放，就可能被我们注意到。这里容易出现一个误解：闻到泥土味，不等于只闻到了一个分子；petrichor 是整体体验，geosmin 只是其中一个参与者。" },
    { id: "seed-rain-seg-11", order: 11, type: "EXPRESSION_NOTE", voiceRole: "TEACHER", sentenceIds: [sentenceId(3, 3)], primaryGoal: "掌握 sensitive to 表示察觉阈值低", script: "‘be sensitive to’ 在这里不是情绪敏感，而是‘对某种气味很容易察觉’。所以 humans are sensitive to it，重点是鼻子能在很低浓度下发现它。遇到 sensitive to smell、light 或 noise，也可以按‘对……反应明显’来理解，不要只停在字面翻译。" },
    { id: "seed-rain-seg-12", order: 12, type: "CONTEXT_CONNECTION", voiceRole: "TEACHER", sentenceIds: [sentenceId(3, 4), sentenceId(4, 1)], primaryGoal: "连接气味可被闻到与气味强弱的下一问题", script: "到这里，文章解释了气味为什么能被闻到。下一段把问题往前推一步：即使机制相似，为什么有些雨闻起来更强？答案要回到干燥时间和地面上积累的东西。" },
    { id: "seed-rain-seg-13", order: 13, type: "ARTICLE_READ", voiceRole: "READER", sentenceIds: paragraphIds(4) },
    { id: "seed-rain-seg-14", order: 14, type: "EXPRESSION_NOTE", voiceRole: "TEACHER", sentenceIds: [sentenceId(4, 2), sentenceId(4, 3)], primaryGoal: "理解 build up 表示逐渐积累", script: "‘build up’ 在这里不是‘建造’，而是逐渐积累。植物留下的油性物质在干燥天气里一点点增加，后来被雨释放出来。这个短语很适合描述压力、经验、灰尘等慢慢堆起来。" },
    { id: "seed-rain-seg-15", order: 15, type: "NORMAL_EXPLANATION", voiceRole: "TEACHER", sentenceIds: [sentenceId(4, 3), sentenceId(4, 4)], primaryGoal: "理解 may therefore 的谨慎推论", script: "这段的重点是‘可能更强’，不是‘每次都更强’。dry spell 之后，地面上积累的物质可能一次释放得更多，所以第一场雨有时更有味道。作者用 may therefore，把推论说得很谨慎。科学文章里的 may 常常是在提醒你：这是合理解释，不是对所有情况的保证。" },
    { id: "seed-rain-seg-16", order: 16, type: "ARTICLE_READ", voiceRole: "READER", sentenceIds: paragraphIds(5) },
    { id: "seed-rain-seg-17", order: 17, type: "DEEP_EXPLANATION", voiceRole: "TEACHER", sentenceIds: paragraphIds(5), primaryGoal: "理解环境条件叠加造成地点差异", script: "最后一个解释是地点差异。温度影响分子移动的速度，风决定它们会不会飘到你这里，土壤和植物又提供了不同的原料。它们不是四个互相独立的答案，而是共同影响‘你最后闻到什么’。所以文章没有把气味归结为一个固定原因，而是把它看成环境条件叠加后的结果。" },
    { id: "seed-rain-seg-18", order: 18, type: "EXPRESSION_NOTE", voiceRole: "TEACHER", sentenceIds: [sentenceId(5, 4)], primaryGoal: "理解 signature 的比喻义", script: "‘a small signature’ 是一个很好的比喻。signature 不是签名本身，而是某个地方留下的可辨认特征。这里说土壤和植物给气味加上自己的小小印记。以后说一个地区、一个人的表达有自己的 signature，也是在说这种独特痕迹。" },
    { id: "seed-rain-seg-19", order: 19, type: "CONTEXT_CONNECTION", voiceRole: "TEACHER", sentenceIds: [sentenceId(5, 4), sentenceId(6, 1)], primaryGoal: "连接地点差异与结尾的环境记录", script: "现在答案已经从‘雨为什么有味道’变成了‘同样的雨为什么不一定闻起来一样’。最后一段会把这些成分重新收回到人的感受：我们闻到的，其实是干燥的地面和水重新接触留下的线索。" },
    { id: "seed-rain-seg-20", order: 20, type: "ARTICLE_READ", voiceRole: "READER", sentenceIds: paragraphIds(6) },
    { id: "seed-rain-seg-21", order: 21, type: "FINAL_WRAP", voiceRole: "TEACHER", sentenceIds: paragraphIds(6), primaryGoal: "回收问题、机制、差异与可迁移表达", script: "这篇文章沿着三步走完了问题。先是命名：petrichor 说的是一类雨后或初雨时的气味，不是一种单独的香水。然后是传递：土壤、植物和微生物留下的化合物，可能借着雨滴撞击产生的细小喷雾进入空气。最后是差异：干燥时间、温度、风、土壤和植物，让每个地方的气味都有自己的变化。语言上可以留下三个观察：before the first drop 用来抓住提前发生的信号；build up 表示逐渐积累；may therefore 提醒我们不要把推论说成保证。下一次闻到雨味时，你闻到的不只是‘泥土味’，而是一段地面和天气重新接触的环境记录。" },
  ],
  annotations: [
    { id: "seed-rain-annotation-petrichor", sentenceId: sentenceId(1, 2), startOffset: 32, endOffset: 41, text: "petrichor", meaningZh: "雨后或初雨时常见的一类气味名称", noteZh: "这里是在给整体现象命名，不是指某一种单独的化学物质。", exampleEn: "Petrichor is strongest after a long dry spell." },
    { id: "seed-rain-annotation-geosmin", sentenceId: sentenceId(3, 2), startOffset: 13, endOffset: 20, text: "geosmin", meaningZh: "一种带有泥土气味的化合物", noteZh: "它是整体气味中的一个重要成分，不等于 petrichor 的全部。", exampleEn: "Geosmin has an earthy smell." },
  ],
};

export const seedCourseSources = [
  { id: "source-seed-rain-acs", title: "What's That After-Rain Smell Made Of?", publisher: "American Chemical Society", url: "https://www.acs.org/pressroom/reactions/library/whats-that-after-rain-smell-made-of.html", notes: "Overview source for petrichor, plant oils, geosmin, and the raindrop aerosol mechanism." },
  { id: "source-seed-rain-geosmin", title: "Geosmin", publisher: "American Chemical Society", url: "https://www.acs.org/molecule-of-the-week/archive/g/geosmin.html", notes: "Use for geosmin as an earthy-odor compound and human sensitivity; do not present it as the whole petrichor mixture." },
];
