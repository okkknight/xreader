import { expect, test } from "@playwright/test";

test("serves a versioned catalog containing only public courses", async ({ request }) => {
  const response = await request.get("/api/v1/catalog");

  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toEqual(expect.objectContaining({
    schemaVersion: 1,
    items: expect.arrayContaining([
      expect.objectContaining({ id: expect.any(String), slug: "why-rain-has-a-smell", publishedAt: expect.any(String), contentVersion: expect.any(String) }),
      expect.objectContaining({ id: expect.any(String), slug: "multi-sentence-fixture", publishedAt: expect.any(String), contentVersion: expect.any(String) }),
    ]),
  }));
});

test("serves course data without leaking storage paths", async ({ request }) => {
  const response = await request.get("/api/v1/articles/multi-sentence-fixture");

  expect(response.status()).toBe(200);
  const payload = await response.json();
  expect(payload).toEqual(expect.objectContaining({
    schemaVersion: 1,
    contentVersion: expect.any(String),
    article: expect.objectContaining({
      slug: "multi-sentence-fixture",
      paragraphs: expect.arrayContaining([
        expect.objectContaining({ sentences: expect.arrayContaining([
          expect.objectContaining({ id: "p01-s02" }),
        ]) }),
      ]),
    }),
  }));
  expect(JSON.stringify(payload)).not.toContain("data/audio/");
  expect(payload.article.courseBlocks[0].audio).toEqual(expect.objectContaining({
    url: expect.stringMatching(/\/api\/v1\/media\//),
    status: "READY",
  }));
});

test("honors catalog ETags and keeps v1 media range-compatible", async ({ request }) => {
  const catalog = await request.get("/api/v1/catalog");
  const eTag = catalog.headers().etag;

  expect(eTag).toBeTruthy();
  const cachedCatalog = await request.get("/api/v1/catalog", { headers: { "If-None-Match": eTag! } });
  expect(cachedCatalog.status()).toBe(304);

  const detail = await (await request.get("/api/v1/articles/multi-sentence-fixture")).json();
  const media = await request.get(detail.article.courseBlocks[0].audio.url, { headers: { Range: "bytes=0-1023" } });
  expect(media.status()).toBe(206);
  expect(media.headers()["content-type"]).toContain("audio/mpeg");
});
