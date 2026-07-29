import type { PlaybackItem } from "@/types/playback";

export class AudioController {
  private queue: PlaybackItem[] = [];
  private index = -1;
  private playRequest = 0;

  constructor(private readonly audio: HTMLAudioElement, private readonly onAdvance?: (item?: PlaybackItem) => void, private readonly onTime?: (item: PlaybackItem, currentTimeMs: number) => void) {
    audio.addEventListener("ended", () => this.next());
    audio.addEventListener("timeupdate", () => { const item = this.queue[this.index]; if (item) this.onTime?.(item, this.audio.currentTime * 1000); });
  }

  setQueue(queue: PlaybackItem[]) { this.queue = queue; this.index = -1; }
  async play(itemId?: string, options: { restart?: boolean } = {}) {
    const request = ++this.playRequest;
    if (itemId) this.index = this.queue.findIndex((item) => item.id === itemId);
    if (this.index < 0) this.index = 0;
    const item = this.queue[this.index];
    if (!item) return;
    if (this.audio.src !== new URL(item.audioPath, window.location.href).href) this.audio.src = item.audioPath;
    if (options.restart) this.audio.currentTime = 0;
    await this.audio.play();
    if (request !== this.playRequest) return;
    this.onAdvance?.(item);
  }
  pause() { this.playRequest += 1; this.audio.pause(); }
  previous() { if (this.index > 0) { this.index -= 1; void this.play().catch(() => undefined); } }
  next() { this.index += 1; if (this.index < this.queue.length) void this.play().catch(() => undefined); else { this.playRequest += 1; this.onAdvance?.(); } }
  seek(seconds: number) { this.audio.currentTime = Math.max(0, seconds); }
  setRate(rate: number) { this.audio.playbackRate = rate; }
}
