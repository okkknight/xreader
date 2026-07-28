import type { PlaybackItem } from "@/types/playback";

export class AudioController {
  private queue: PlaybackItem[] = [];
  private index = -1;

  constructor(private readonly audio: HTMLAudioElement, private readonly onAdvance?: (item?: PlaybackItem) => void) {
    audio.addEventListener("ended", () => this.next());
  }

  setQueue(queue: PlaybackItem[]) { this.queue = queue; this.index = -1; }
  async play(itemId?: string) {
    if (itemId) this.index = this.queue.findIndex((item) => item.id === itemId);
    if (this.index < 0) this.index = 0;
    const item = this.queue[this.index];
    if (!item) return;
    if (this.audio.src !== new URL(item.audioPath, window.location.href).href) this.audio.src = item.audioPath;
    await this.audio.play();
    this.onAdvance?.(item);
  }
  pause() { this.audio.pause(); }
  seek(seconds: number) { this.audio.currentTime = Math.max(0, seconds); }
  setRate(rate: number) { this.audio.playbackRate = rate; }
  private next() { this.index += 1; if (this.index < this.queue.length) void this.play(); else this.onAdvance?.(); }
}
