export type ReaderProgress = { guidedBlockId?: string; readingSentenceId?: string; lastMode?: "GUIDED" | "READING"; completed?: boolean; updatedAt: number };
type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function createProgressStore(storage: StorageLike) {
  const key = (articleId: string) => `xreader:progress:${articleId}`;
  return {
    load(articleId: string): ReaderProgress | null {
      try {
        const raw = storage.getItem(key(articleId));
        if (!raw) return null;
        return JSON.parse(raw) as ReaderProgress;
      } catch { return null; }
    },
    save(articleId: string, progress: Omit<ReaderProgress, "updatedAt">) {
      try { storage.setItem(key(articleId), JSON.stringify({ ...(this.load(articleId) ?? {}), ...progress, updatedAt: Date.now() })); } catch { /* Progress is optional for restricted browser storage. */ }
    },
  };
}
