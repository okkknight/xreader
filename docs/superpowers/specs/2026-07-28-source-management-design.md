# XReader 来源管理设计

## 当前缺口

`Source` 与 `ArticleSource` 已在 Prisma 中存在，审核草稿也能保存来源，但后台“来源”页仍是占位内容。管理员因此无法在应用内创建、编辑、关联或删除来源，Phase 2 手工生产路径无法从来源开始，也无法在 QA 前检查事实备注。

## 范围

为单篇文章提供受保护的来源 CRUD。每条关联包括来源元数据、角色、可信度说明和关键事实；来源可关联多篇文章。删除动作解除当前文章关联，只有该来源没有任何关联时才删除来源记录。所有写入复用管理员会话和同源校验。

## 数据契约

```ts
type SourceDraft = {
  id?: string;
  title: string;
  publisher?: string;
  url: string;
  publishedAt?: string;
  accessedAt?: string;
  role: string;
  reliabilityNote?: string;
  keyFacts: string[];
};
```

`ArticleSource.factNotes` 保存 `{ reliabilityNote, keyFacts }`。空 `keyFacts` 可保存为草稿，但 QA 的事实人工确认仍不可绕过。公共 API 不返回来源或这些备注。

## API 与编辑器

- `GET /api/admin/articles/[id]/sources` 返回当前文章的 `SourceDraft[]`。
- `POST /api/admin/articles/[id]/sources` 创建来源并关联，或以 `id` 更新当前关联来源。
- `DELETE /api/admin/articles/[id]/sources/[sourceId]` 解除关联；孤立来源才删除。
- 非法 URL、空标题、无效日期和缺少角色返回 400；未授权返回 401。
- 编辑器字段为标题、发布者、URL、发布日期、可信度说明、角色和逐行关键事实；新增记录默认 `FACT_CHECK` 和当天访问日。

## 验收

- 管理员可创建、编辑、删除来源关联；匿名请求被拒绝。
- 关键事实和可信度说明重载后保持不变。
- 共享来源从一篇文章删除时仍保留给另一篇文章。
- 公共文章 API 不含 URL、事实备注或来源标题。
