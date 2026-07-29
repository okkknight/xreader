# Archive Reading Shelf Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the archive into a responsive single-column shelf of illustrated course cards while preserving article navigation and progress labels.

**Architecture:** Keep `ArticleList` responsible for course data and local progress; introduce a slug-to-static-cover mapping inside the archive component. CSS defines a reusable horizontal card that collapses to a vertical card on mobile.

**Tech Stack:** Next.js App Router, React, TypeScript, Next Image, CSS, Vitest, generated PNG assets.

## Global Constraints

- Preserve each card link as `/articles/${article.slug}`.
- Keep course title, translation, description, and progress state code-native.
- Use a project-local generated image asset; do not reference generated images outside the repository.
- Do not add visible categories, badges, dashboards, or extra marketing copy.
- Do not stage, commit, or alter unrelated existing worktree changes.

---

### Task 1: Reuse course primary covers in the archive

**Files:**
- Uses: `public/images/why-rain-has-a-smell-cover.png`

**Interfaces:**
- Produces: an archive-card image region backed by the same course cover used on the homepage.

- [ ] **Step 1: Verify the homepage primary cover**

Use `/images/why-rain-has-a-smell-cover.png` for the rain card; do not generate or use a separate archive thumbnail.

### Task 2: Implement reusable vertical course cards

**Files:**
- Modify: `src/components/archive/article-list.tsx`
- Modify: `src/styles/archive.css`
- Test: `tests/unit/article-list.test.tsx`

**Interfaces:**
- Consumes: `PublicArticle`, `createProgressStore`, `/images/why-rain-has-a-smell-cover.png`.
- Produces: `.archive-item` cards with image, metadata, title, translation, description, status, and article link.

- [ ] **Step 1: Write the failing component test**

Render `ArticleList` with one rain article; assert the card image is present, the card link targets the article slug, and the English title and Chinese title are visible.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- --run tests/unit/article-list.test.tsx`

Expected: FAIL because the existing list item has no image.

- [ ] **Step 3: Implement image mapping and card markup**

Use `next/image`, an `ARCHIVE_COVER_IMAGES` map keyed by slug, and `/images/why-rain-has-a-smell-cover.png` as the temporary fallback for unknown slugs. Keep all existing course copy and navigation in the card content region.

- [ ] **Step 4: Implement the responsive reading-shelf styles**

Use a one-column list; style desktop cards as a two-column image/content row with a rounded image frame and restrained hover lift; use a stacked layout below 700px.

- [ ] **Step 5: Run the focused test to verify it passes**

Run: `npm test -- --run tests/unit/article-list.test.tsx`

Expected: PASS with an image and target link.

### Task 3: Simplify the archive introduction and verify UX

**Files:**
- Modify: `src/app/archive/page.tsx`
- Modify: `src/styles/archive.css`
- Verify: `tests/unit/article-list.test.tsx`

**Interfaces:**
- Consumes: the list from Task 2.
- Produces: archive page with a compact title and vertical shelf.

- [ ] **Step 1: Remove the visible English archive label**

Keep the Chinese heading and description but remove the `Archive` pre-label.

- [ ] **Step 2: Run static verification**

Run: `npx tsc --noEmit && npm run lint && git diff --check`

Expected: all commands exit successfully.

- [ ] **Step 3: Verify the Browser desktop view**

Open `http://localhost:3000/archive`; confirm a single vertical card column, visible image, and no framework error overlay.

- [ ] **Step 4: Verify mobile and navigation**

At 390px wide, confirm no horizontal overflow and complete card text. Click the card and confirm navigation to its article route.
