import type { CourseImport, GuideDepthInput, ParagraphGuideInput } from "@/types/article";

const paragraphs = [
  ["People often notice the smell of rain before the first drop reaches the ground.", "That familiar scent has a name: petrichor.", "The word joins Greek roots for stone and a fluid once linked to the earth.", "It describes a real mixture rather than one single perfume."],
  ["It appears when dry soil, plants, and tiny organisms release compounds into the air.", "Rain carries those compounds upward as small droplets hit the ground.", "The droplets can burst and make a fine spray.", "That spray gives the scent a route into the air around you."],
  ["One important compound is made by soil bacteria.", "It is called geosmin.", "Humans are unusually sensitive to it, even at very low levels.", "That sensitivity may explain why a light shower can seem surprisingly noticeable."],
  ["Another part comes from oils that plants leave on dry surfaces.", "Those oils build up during dry weather.", "After a long dry spell, the first rain can release more of them at once.", "A sudden summer shower may therefore smell stronger than steady rain."],
  ["The smell is not exactly the same in every place.", "Temperature changes how quickly compounds move through the air.", "Wind decides whether they reach you or drift away.", "Soil and local plants add their own small signature."],
  ["So the next time rain seems to have a smell, you are noticing a small weather story.", "The air is carrying evidence of a dry landscape meeting water again.", "It is a sensory clue about what was on the ground before the rain began.", "That is why the same weather can feel different in two nearby places."],
];

const meanings = [
  ["人们常常在第一滴雨落地前，就已经闻到了雨的气味。", "这种熟悉的气味有一个名字：petrichor。", "这个词把表示石头的希腊词根和一种曾被认为与土地有关的液体联系在一起。", "它描述的是一种真实的混合物，而不是某一种单独的香水。"],
  ["这种气味出现在干燥的土壤、植物和微小生物把化合物释放到空气中时。", "雨滴撞击地面时，会把这些化合物带向上方。", "这些液滴会破裂，形成细小的喷雾。", "这层喷雾给了气味进入你周围空气的路径。"],
  ["其中一种重要化合物由土壤细菌产生。", "它叫作 geosmin。", "即使浓度非常低，人类也能异常敏锐地察觉到它。", "这种敏感性可能解释了为什么一场小雨也会显得格外明显。"],
  ["另一部分气味来自植物留在干燥表面的油。", "这些油会在干燥天气里逐渐积累。", "长时间干旱后，第一场雨可能一次释放更多这种物质。", "因此，突然来的一场夏雨可能比持续的小雨闻起来更强。"],
  ["这种气味在不同地方并不完全相同。", "温度会改变化合物在空气中移动的速度。", "风决定它们会不会到达你这里，还是被吹走。", "土壤和当地植物也会留下自己的细小特征。"],
  ["所以下次你觉得雨有气味时，其实是在注意一个小小的天气故事。", "空气正携带着干燥土地重新遇到水的证据。", "这是一个感官线索，告诉你下雨前地面上曾经有什么。", "这就是为什么相同的天气在相邻的两个地方也会给人不同的感觉。"],
];

const depths: GuideDepthInput[][] = [
  ["NORMAL", "NORMAL", "QUICK", "QUICK"], ["NORMAL", "DEEP", "NORMAL", "NORMAL"], ["QUICK", "NORMAL", "DEEP", "NORMAL"], ["QUICK", "NORMAL", "DEEP", "NORMAL"], ["NORMAL", "NORMAL", "NORMAL", "DEEP"], ["QUICK", "NORMAL", "NORMAL", "DEEP"],
];
const sentenceId = (paragraph: number, sentence: number) => `seed-rain-p${String(paragraph).padStart(2, "0")}-s${String(sentence).padStart(2, "0")}`;

// Codex-authored continuous guided-reading scripts. Do not assemble these from
// sentence guide fields: the paragraph script is the authored teaching work.
const guidedScripts = [
  "People often notice the smell of rain before the first drop reaches the ground. 这里先抓住一个很熟悉、也很有画面感的经验：雨还没有真正落下来，我们却已经闻到了它。 That familiar scent has a name: petrichor. 这个名字不是为了把现象变得神秘，而是告诉我们，这种气味确实值得被单独辨认出来。 The word joins Greek roots for stone and a fluid once linked to the earth. 这句话是在解释词的来源：它把石头和土地联系在一起，所以这个词从一开始就带着一种“来自地面”的感觉。 It describes a real mixture rather than one single perfume. 重点在 rather than：petrichor 不是一瓶叫作“雨”的香水，而是许多来自土壤、植物和微生物的成分混在一起形成的气味。先给现象命名，再说明它不是单一物质，作者把问题的入口搭好了。",
  "It appears when dry soil, plants, and tiny organisms release compounds into the air. 现在文章从“它叫什么”推进到“它怎么出现”：干燥的土地、植物和微小生物，都会把一些化合物放进空气里。 Rain carries those compounds upward as small droplets hit the ground. 这里的 carry upward 不是说雨水把气味简单地冲上去，而是在描述雨滴撞击地面时造成的空气运动。 The droplets can burst and make a fine spray. 雨滴落下后会破裂，形成很细的喷雾；正是这个动作，让原本贴近地面的成分有机会离开地面。 That spray gives the scent a route into the air around you. 所以喷雾就是气味到达鼻子附近的路线：不是雨凭空制造了气味，而是把地面上的成分带进了我们正在呼吸的空气。",
  "One important compound is made by soil bacteria. It is called geosmin. 这一处作者把混合气味中的一个成分单独拿出来：它由土壤细菌产生，名字叫 geosmin。 Humans are unusually sensitive to it, even at very low levels. 这句是本段的重点。人类对 geosmin 特别敏感，浓度很低时也可能察觉到它，所以鼻子并不需要等到空气里充满这种成分才会有反应。 That sensitivity may explain why a light shower can seem surprisingly noticeable. 于是前面的机制有了一个具体解释：即使只是小雨，只要带起了少量 geosmin，我们也可能觉得雨的气味非常明显。这里不是说 geosmin 等于全部 petrichor，而是说它帮助我们理解，为什么这么微量的东西会产生这么强的感受。",
  "Another part comes from oils that plants leave on dry surfaces. 但雨的气味不只有土壤细菌这一条线，植物也在其中留下了自己的部分。 Those oils build up during dry weather. 天气越干，这些植物油就越有机会停留并积累在地面或植物表面。 After a long dry spell, the first rain can release more of them at once. 这解释了一个常见体验：久旱之后的第一场雨，像是一下子把一段时间里积攒的成分释放出来。 A sudden summer shower may therefore smell stronger than steady rain. 因此，突然落下的夏季阵雨可能比持续、缓慢的降雨闻起来更强；差别不只在雨量，也在于地面已经准备了多少可被带入空气的物质。",
  "The smell is not exactly the same in every place. 到这里，作者又加了一个限制：我们说“雨的气味”时，并不是每个地方都闻到同一种味道。 Temperature changes how quickly compounds move through the air. 温度会影响这些化合物在空气中移动的速度。 Wind decides whether they reach you or drift away. 风则决定它们会不会真的飘到你这里；即使地面释放了成分，风向不对，你也可能闻不到。 Soil and local plants add their own small signature. 最后，土壤和当地植物又各自加上一点地方特色。所以雨的气味不是一张固定配方，而是土地、天气和空气共同留下的现场签名。",
  "So the next time rain seems to have a smell, you are noticing a small weather story. 现在回到开头的问题：你闻到的不是“雨水本身的一种香味”，而是一连串事件留下的结果。 The air is carrying evidence of a dry landscape meeting water again. 空气把干燥土地重新遇到水的证据带了过来；土壤、植物、细菌和雨滴都参与了这段故事。 It is a sensory clue about what was on the ground before the rain began. 所以气味也是一种线索，让你在看不见地面细节的时候，仍然能感觉到下雨前那里发生过什么。 That is why the same weather can feel different in two nearby places. 同样的天气，在相邻的两个地方也可能给人不同的感觉，因为真正决定气味的，还有每一块土地自己的组成。",
];

const paragraphGoals = [
  "先给雨的气味命名，再分清它不是单一物质。",
  "解释地面上的化合物如何通过雨滴喷雾进入空气。",
  "用 geosmin 说明人为什么能闻到微量成分。",
  "说明干燥天气如何让植物油积累并在第一场雨中释放。",
  "解释温度、风、土壤和植物造成的地点差异。",
  "把气味收束为土地与雨水重新接触的环境线索。",
];

const focusScripts: Array<Array<string | undefined>> = [
  ["这里先抓住一个熟悉经验：雨还没真正落下来，我们却已经闻到了它。", "petrichor 是这个现象的名字，不是在创造一种神秘的香水。", "词源把石头和土地联系起来，呼应这种气味来自地面的感觉。", "重点在 rather than：petrichor 是许多成分的混合物，不是单一香水。"],
  ["现在文章从“它叫什么”推进到“它怎么出现”：干燥土地、植物和微小生物都会释放化合物。", "这里的 carry upward 不是说雨水把气味简单地冲上去，而是在描述雨滴撞击地面时造成的空气运动。", "雨滴破裂形成细小喷雾，让原本贴近地面的成分有机会离开地面。", "喷雾就是气味到达鼻子附近的路线；雨不是凭空制造气味，而是把地面成分带进空气。"],
  ["作者把混合气味中的一个成分单独拿出来：它由土壤细菌产生。", "它的名字叫 geosmin，是整体气味中的一个具体成分。", "这句是本段重点：人类对 geosmin 特别敏感，浓度很低时也可能察觉到它。", "geosmin 不等于完整的 petrichor，但它解释了为什么少量成分也会让小雨显得明显。"],
  ["雨的气味不只有土壤细菌这一条线，植物也会留下自己的部分。", "这些植物油会在干燥期间停留并积累在地面或植物表面。", "after a long dry spell 和 at once 共同解释了为什么第一场雨可能特别强。", "therefore 把前面的积累和最后的气味强度连起来：突然阵雨可能比持续降雨更浓。"],
  ["not exactly the same 是一个重要限制：雨的气味没有固定配方。", "温度会影响化合物在空气中移动的速度。", "whether they reach you or drift away 讲的是风决定你能不能真正闻到。", "local signature 把化学机制收束到地点差异：土壤和植物会留下自己的签名。"],
  ["这里回到开头的问题：你闻到的不是雨水本身的一种香味，而是一连串事件的结果。", "evidence of a dry landscape meeting water again 是全文的总结性画面。", "气味是一条感官线索，让你感觉到下雨前地面上发生过什么。", "That is why 回扣全文：不同土地会让相同天气产生不同感受。"],
];

function makeGuides(paragraphIndex: number, sentences: string[]): ParagraphGuideInput {
  const paragraphId = `seed-rain-p${String(paragraphIndex + 1).padStart(2, "0")}`;
  const sentenceGuides = sentences.map((text, index) => ({
    id: `${sentenceId(paragraphIndex + 1, index + 1)}-guide`, paragraphId, sentenceId: sentenceId(paragraphIndex + 1, index + 1), order: index + 1, depth: depths[paragraphIndex][index], originalReadText: text, meaningZh: meanings[paragraphIndex][index], sentenceFunction: index === 0 ? "开启或推进本段问题" : index === sentences.length - 1 ? "收束本段并留下下一步理解" : "补充或推进本段解释", primaryTeachingGoal: depths[paragraphIndex][index] === "DEEP" ? "抓住影响全文理解的关键机制或逻辑" : depths[paragraphIndex][index] === "NORMAL" ? "理解句子主旨并注意一个主要表达或逻辑" : "快速确认句子基本含义", focusScript: focusScripts[paragraphIndex][index], replayAfterExplanation: depths[paragraphIndex][index] === "DEEP",
  }));
  return { id: `${paragraphId}-guide`, paragraphId, order: paragraphIndex + 1, paragraphGoal: paragraphGoals[paragraphIndex], openingBridge: paragraphIndex === 0 ? "先从一个熟悉的雨天气味开始。" : undefined, scriptText: guidedScripts[paragraphIndex], sentenceGuides };
}

export const seedCourse: CourseImport = {
  article: { id: "seed-rain", slug: "why-rain-has-a-smell", titleEn: "Why Does Rain Have a Smell?", titleZh: "为什么雨有一种特别的气味？", dekZh: "从干燥的土地到第一滴雨，空气里发生了什么。", topic: "Nature & Science", difficulty: "B1-B2", status: "PUBLISHED", publishedAt: new Date("2026-07-28T00:00:00.000Z") },
  paragraphs: paragraphs.map((sentences, index) => ({ id: `seed-rain-p${String(index + 1).padStart(2, "0")}`, order: index + 1, text: sentences.join(" "), sentences: sentences.map((text, sentenceIndex) => ({ id: sentenceId(index + 1, sentenceIndex + 1), order: sentenceIndex + 1, text })) })),
  paragraphGuides: paragraphs.map((sentences, index) => makeGuides(index, sentences)),
  annotations: [
    { id: "seed-rain-annotation-petrichor", sentenceId: sentenceId(1, 2), startOffset: 31, endOffset: 40, text: "petrichor", meaningZh: "雨后或初雨时常见的一类气味名称", noteZh: "这里是在给整体现象命名，不是指一种单独的化学物质。", exampleEn: "Petrichor is strongest after a long dry spell." },
    { id: "seed-rain-annotation-geosmin", sentenceId: sentenceId(3, 2), startOffset: 13, endOffset: 20, text: "geosmin", meaningZh: "一种带有泥土气味的化合物", noteZh: "它是整体气味中的一个重要成分，不等于 petrichor 的全部。", exampleEn: "Geosmin has an earthy smell." },
  ],
};

export const seedCourseSources = [
  { id: "source-seed-rain-acs", title: "What's That After-Rain Smell Made Of?", publisher: "American Chemical Society", url: "https://www.acs.org/pressroom/reactions/library/whats-that-after-rain-smell-made-of.html", notes: "Overview source for petrichor, plant oils, geosmin, and the raindrop aerosol mechanism." },
  { id: "source-seed-rain-geosmin", title: "Geosmin", publisher: "American Chemical Society", url: "https://www.acs.org/molecule-of-the-week/archive/g/geosmin.html", notes: "Use for geosmin as an earthy-odor compound; do not present it as the whole petrichor mixture." },
];
