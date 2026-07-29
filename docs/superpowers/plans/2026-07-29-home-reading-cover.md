# Home Reading Cover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present the homepage as a centered illustrated reading-cover card floating over a blurred version of the same article image, while preserving the existing article entry links.

**Architecture:** Keep article data and progress lookup in `TodayArticleFeature`; reuse the generated static cover image both as the crisp card media and as a CSS-only blurred page backdrop. Keep the page component as the server-side composition boundary.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS, Vitest, generated WebP/PNG static asset.

## Global Constraints

- Preserve the `/articles/${slug}` guided-reading link and `/articles/${slug}?mode=reading` reading link.
- Keep all visible interactive copy code-native.
- Do not add visible marketing copy, category badges, or progress labels to the new cover.
- Use the same cover image for the main card and the blurred page background; do not introduce a separate background asset.
- Use a project-local generated image asset; never reference an asset that only exists outside the repository.
- Do not stage or commit unrelated existing worktree changes.

---

### Task 1: Add the reading-cover background asset

**Files:**
- Create: `public/images/why-rain-has-a-smell-cover.png`

**Interfaces:**
- Produces: `/images/why-rain-has-a-smell-cover.png`, a text-free image used by the homepage card.

- [ ] **Step 1: Generate a text-free illustration**

Use the built-in image generator with a 16:9 editorial illustration brief: rain falling on dry soil and plant leaves, tiny airborne droplets and soft scent-like particles, restrained forest-green, slate-blue, wet-earth brown, and pale mist; leave darker quiet space across the lower-left for HTML copy; no people, no lettering, no logo, no watermark.

- [ ] **Step 2: Inspect the generated image**

Confirm that the image has no text, has a readable darker lower-left region, and reads as rain rather than a generic landscape.

- [ ] **Step 3: Copy the selected final image into `public/images/why-rain-has-a-smell-cover.png`**

The application must reference only this workspace asset.

### Task 2: Implement the cover-card homepage

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/home/today-article-feature.tsx`
- Modify: `src/styles/home.css`
- Test: `tests/unit/app-shell.test.tsx` or a new focused homepage component test

**Interfaces:**
- Consumes: `PublicArticle`, `/images/why-rain-has-a-smell-cover.png`, `createProgressStore`.
- Produces: semantic homepage with an `article.today-feature` cover card and working guided/reading links.

- [ ] **Step 1: Write the failing component test**

Render `TodayArticleFeature` and assert that the article title, translation, guided link, reading link, and cover card image are present.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- --run tests/unit/today-article-feature.test.tsx`

Expected: FAIL because the current component has no cover-image element or cover-card structure.

- [ ] **Step 3: Implement the semantic card structure**

Use a `next/image` background image with meaningful alt text, place title, translation, and both links in an overlay content region, and retain the existing progress-dependent guided label.

- [ ] **Step 4: Replace the old split homepage styles**

Make `.home-page` a centered single-column container with a blurred, deep-green version of the same cover image as its background; make `.today-feature` a slightly smaller media frame with breathing room on all sides; set desktop and mobile aspect ratios; use a lower-edge dark gradient solely to support the specified HTML overlay; style the primary and secondary buttons as a matched compact pair.

- [ ] **Step 5: Run the focused test to verify it passes**

Run: `npm test -- --run tests/unit/today-article-feature.test.tsx`

Expected: PASS with both links and cover image present.

### Task 3: Verify responsive visual fidelity

**Files:**
- Verify only: `src/app/page.tsx`, `src/components/home/today-article-feature.tsx`, `src/styles/home.css`

**Interfaces:**
- Consumes: the final cover card from Task 2.
- Produces: desktop and mobile QA evidence.

- [ ] **Step 1: Run static checks**

Run: `npx tsc --noEmit && npm run lint && git diff --check`

Expected: all commands exit successfully.

- [ ] **Step 2: Verify desktop cover card in the Browser**

Open `http://localhost:3000/`; confirm the card is centered, its image loads, title and translation are readable, and both CTA links are visible.

- [ ] **Step 3: Verify mobile cover card in the Browser**

Set a 390px-wide viewport; confirm no horizontal overflow, no text clipping, and vertically stacked or wrapped controls retain clear tap targets.

- [ ] **Step 4: Verify the core interactions**

Click “开始讲解” or “继续讲解” and confirm the article route opens; return to the homepage and click “先读文章” and confirm the `mode=reading` query is present.
