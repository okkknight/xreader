# 使用真人英语带读总 Prompt 重写雨味课程

请先读取项目中的：

```text
XReader_真人英语带读课总Prompt.md
```

然后使用该总 Prompt，重新生成下面这篇课程的完整讲稿。

## 测试目的

这不是新建文章。

保持英文原文完全不变，用来验证新的单 Prompt 课程生产模式是否真正解决旧稿问题。

旧稿存在：

- 没有自然开场；
- 直接进入第一句；
- 英文一句、中文解释一句；
- 主要解释文章内容；
- 没有清晰英语学习成果；
- 节奏赶；
- 缺少教师取舍；
- 缺少解释后重听；
- 结尾没有课程式英语收获回顾。

新版必须明显改善以上问题。

---

## 课程信息

```text
英文标题：Why Does Rain Have a Smell?
中文标题：为什么雨有一种特别的气味？
目标水平：B1–B2 中国成年学习者
目标时长：12–16分钟
教师风格：亲切、有判断、自然、有轻微播客感，不考试化，不幼儿化
```

---

## 英文文章

### Paragraph 1

- `seed-rain-p01-s01`  
  People often notice the smell of rain before the first drop reaches the ground.

- `seed-rain-p01-s02`  
  That familiar scent has a name: petrichor.

- `seed-rain-p01-s03`  
  The word joins Greek roots for stone and a fluid once linked to the earth.

- `seed-rain-p01-s04`  
  It describes a real mixture rather than one single perfume.

### Paragraph 2

- `seed-rain-p02-s01`  
  It appears when dry soil, plants, and tiny organisms release compounds into the air.

- `seed-rain-p02-s02`  
  Rain carries those compounds upward as small droplets hit the ground.

- `seed-rain-p02-s03`  
  The droplets can burst and make a fine spray.

- `seed-rain-p02-s04`  
  That spray gives the scent a route into the air around you.

### Paragraph 3

- `seed-rain-p03-s01`  
  One important compound is made by soil bacteria.

- `seed-rain-p03-s02`  
  It is called geosmin.

- `seed-rain-p03-s03`  
  Humans are unusually sensitive to it, even at very low levels.

- `seed-rain-p03-s04`  
  That sensitivity may explain why a light shower can seem surprisingly noticeable.

### Paragraph 4

- `seed-rain-p04-s01`  
  Another part comes from oils that plants leave on dry surfaces.

- `seed-rain-p04-s02`  
  Those oils build up during dry weather.

- `seed-rain-p04-s03`  
  After a long dry spell, the first rain can release more of them at once.

- `seed-rain-p04-s04`  
  A sudden summer shower may therefore smell stronger than steady rain.

### Paragraph 5

- `seed-rain-p05-s01`  
  The smell is not exactly the same in every place.

- `seed-rain-p05-s02`  
  Temperature changes how quickly compounds move through the air.

- `seed-rain-p05-s03`  
  Wind decides whether they reach you or drift away.

- `seed-rain-p05-s04`  
  Soil and local plants add their own small signature.

### Paragraph 6

- `seed-rain-p06-s01`  
  So the next time rain seems to have a smell, you are noticing a small weather story.

- `seed-rain-p06-s02`  
  The air is carrying evidence of a dry landscape meeting water again.

- `seed-rain-p06-s03`  
  It is a sensory clue about what was on the ground before the rain began.

- `seed-rain-p06-s04`  
  That is why the same weather can feel different in two nearby places.

---

## 特别要求

1. 开场不要直接讲 `petrichor`，先从用户熟悉的雨前气味体验进入。
2. 开场要让用户知道，这篇课除了回答雨味来源，还会学习英语如何解释过程和谨慎说明原因。
3. 不要逐句翻译。
4. 可以把简单句连续朗读后统一解释。
5. `petrichor` 和 `geosmin` 可以明确告诉用户认识即可，不要求背。
6. 真正值得考虑的英语学习机会包括但不限于：
   - `before the first drop reaches the ground`
   - `rather than`
   - `carry those compounds upward`
   - `give the scent a route into`
   - `be sensitive to`
   - `even at very low levels`
   - `may explain why`
   - `after a long dry spell`
   - `at once`
   - `therefore`
   - `whether ... or ...`
   - `add their own small signature`
   - `evidence of`
   - `That is why`
7. 不要把以上列表全部讲完。根据迁移价值和节奏主动取舍。
8. 至少有一处明确说某个内容知道即可。
9. 至少有一处解释后带着目的重新听原句。
10. 结尾回顾少量真实英语收获，不要只总结雨味知识。
11. 输出严格遵守总 Prompt 的 JSON Schema。
12. 生成后运行覆盖校验，但不要为了覆盖让讲稿重新变成逐句结构。
