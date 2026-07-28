# 内容生产流程

## 1. 总体原则

内容生产不是“一次 Prompt 生成一切”。

完整流程：

```text
选题
→ 资料收集
→ 事实卡
→ 原创英文文章
→ 英文编辑
→ 文章结构分析
→ 教学导演
→ 讲解稿
→ 讲稿编辑
→ 音频生成
→ 完整试听
→ 发布
```

每一步都保存结构化中间结果，支持局部修改和重新生成。

## 2. 选题

### 选题条件

一个合格选题应满足：

- 能用一句问题表达
- 普通成年人会好奇
- 500 词左右能讲清
- 不依赖当天时效
- 有明确事实依据
- 能产生 4–6 个有迁移价值的英文表达
- 不需要大量专有名词
- 不以争议立场为主要卖点

### 选题评分

每项 1–5 分：

- 好奇心
- 信息价值
- 可解释性
- 英语表达价值
- 事实可核验性
- B1–B2 适配性

低于 22/30 的选题不进入制作。

## 3. 资料收集

### 要求

- 至少两个可靠来源。
- 优先使用机构、大学、研究组织、博物馆、专业出版物等。
- 对关键事实记录来源。
- 不把整篇受保护文章直接作为生成目标。
- 保存资料标题、来源、日期、链接和事实摘录。

### Source Record

```json
{
  "id": "src_001",
  "title": "Source title",
  "publisher": "Publisher",
  "url": "https://example.com",
  "publishedAt": "2026-01-01",
  "accessedAt": "2026-07-28",
  "reliabilityNote": "Primary institutional explanation",
  "keyFacts": [
    "Fact one",
    "Fact two"
  ]
}
```

## 4. 事实卡

资料收集完成后，先生成事实卡，不直接写文章。

```json
{
  "topicQuestion": "Why do songs get stuck in our heads?",
  "centralAnswer": "Repeated, simple and emotionally salient musical patterns can remain active in memory.",
  "facts": [
    {
      "id": "fact_01",
      "statement": "Earworms are commonly described as involuntary musical imagery.",
      "sourceIds": ["src_001", "src_002"],
      "confidence": "high"
    }
  ],
  "uncertainClaims": [],
  "doNotClaim": [
    "Do not claim that one single brain mechanism explains every earworm."
  ]
}
```

所有文章事实应能追溯到事实卡。

## 5. 原创英文文章

### 写作要求

- 450–600 词
- 6–8 段
- B1–B2
- 一个核心问题
- 开头迅速建立问题
- 每段承担明确功能
- 有具体例子
- 避免 AI 式总结和排比
- 不以“Have you ever wondered...”作为固定开头
- 不堆砌定义
- 不为了教学强行塞词
- 不近距离模仿任何单一来源

### 推荐结构

```text
1. 具体日常现象
2. 提出核心问题
3. 第一层解释
4. 例子或证据
5. 第二层解释或限制
6. 现实意义
7. 克制收束
```

结构可以变化，不能模板化套用。

## 6. 英文编辑

单独执行英文编辑，不同时生成讲解。

检查：

- 事实是否完全来自事实卡
- 语法
- 自然度
- CEFR 难度
- 段落推进
- 重复
- 模板句
- 句长分布
- 口头朗读自然度
- 独特表达是否疑似贴近来源

输出：

- 编辑后文章
- 修改说明
- 文章难度报告
- 需要人类复核的地方

## 7. 句子切分

文章定稿后才生成稳定结构。

```json
{
  "paragraphs": [
    {
      "id": "p01",
      "order": 1,
      "sentences": [
        {
          "id": "p01s01",
          "order": 1,
          "text": "..."
        }
      ]
    }
  ]
}
```

文章发布后不要随意更改句子 ID。若修改原文，应重新检查所有讲解映射。

## 8. 文章分析

文章分析不是讲稿。

应输出：

- 核心问题
- 核心答案
- 全文结构
- 每段功能
- 逻辑转折
- 长难句
- 容易误解处
- 有价值表达
- 不值得讲的简单信息
- 必要背景
- 作者语气和谨慎程度

## 9. 教学导演

教学导演决定在哪里停、为什么停、讲多少。

每个语义块计算：

- 理解难度
- 文章重要性
- 教学价值

然后选择：

- `SKIP`
- `QUICK`
- `NORMAL`
- `DEEP`

### 决策对象

```json
{
  "blockId": "b04",
  "sentenceIds": ["p03s01", "p03s02"],
  "decision": "DEEP",
  "primaryReason": "core_claim",
  "learnerDifficulty": "The contrast is easy to flatten in translation.",
  "teachingGoal": "Understand the author's central distinction.",
  "connectionToPrevious": "Moves from the common explanation to the article's main answer.",
  "nextFunction": "The following paragraph gives an example.",
  "replayRecommended": true
}
```

### 数量约束

- 全文讲解停顿点：6–10
- 深讲：3–4
- 核心表达：4–6
- 一次停顿只有一个主要教学目标
- 不要求每段停一次
- 不要求每句都解释

## 10. 讲解稿生成

讲解稿应基于：

- 定稿文章
- 文章分析
- 教学导演
- 老师角色协议
- 本篇已讲表达清单
- 全文时长目标

必须一次生成整篇课程的完整讲解逻辑，再切分为片段。

不能对每段独立调用、独立写稿，否则容易：

- 重复
- 人格漂移
- 忘记前文
- 每段都像新开场
- 无法控制全局密度

## 11. 讲解稿编辑

自动检查后，编辑者进行人工处理：

- 删除多余开场语
- 删除没有价值的词汇解释
- 修复中英文切换
- 强化前后连接
- 降低长句
- 避免重复翻译
- 保证深讲点数量
- 保持老师人格一致

## 12. 音频生成

### 分片生成

- 原文按句或语义块生成
- 讲解按片段生成
- 每片通常 10–40 秒
- 片段之间由播放器安排停顿
- 允许单片重新生成

### 音频角色

- 原文朗读：稳定、清楚、自然
- 老师讲解：亲切、灵活、有播客感
- 建议使用两个不同声音，或至少不同声音配置

## 13. 完整试听

发布前必须按用户实际播放队列从头听到尾。

检查：

- 总时长
- 声音一致性
- 中英文切换
- 重复
- 错读
- 停顿
- 高亮映射
- 片段衔接
- 是否像一个人在持续讲解
- 是否存在信息过载

## 14. 发布

只有以下项目全部通过才可发布：

- 事实通过
- 英文通过
- 教学通过
- 讲稿通过
- 音频通过
- UI 预览通过
- 来源记录完整
- 发布日期确定

AI 生成状态不能直接等于已发布状态。
