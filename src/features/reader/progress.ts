export type ReaderProgress = { guidedSegmentId?: string; readingSentenceId?: string; updatedAt: number };
type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function createProgressStore(storage: StorageLike) {
  const key = (articleId: string) => `xreader:progress:${articleId}`;
  return {
    load(articleId: string): ReaderProgress | null {
      const raw = storage.getItem(key(articleId));
      if (!raw) return null;
      try { return JSON.parse(raw) as ReaderProgress; } catch { return null; }
    },
    save(articleId: string, progress: Omit<ReaderProgress, "updatedAt">) {
      storage.setItem(key(articleId), JSON.stringify({ ...progress, updatedAt: Date.now() }));
    },
  };
}
