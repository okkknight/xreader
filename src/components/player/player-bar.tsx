"use client";

type Props = { playing: boolean; rate: number; subtitle?: string; onPlayPause: () => void; onRate: (rate: number) => void };

export function PlayerBar({ playing, rate, subtitle, onPlayPause, onRate }: Props) {
  return <section className="player-bar" aria-label="播放器">
    <button type="button" className="play-button" onClick={onPlayPause} aria-label={playing ? "暂停" : "播放"}>{playing ? "Ⅱ" : "▶"}</button>
    <div className="player-copy"><span>跟读播放</span><span className="player-progress" /></div>
    <p className="player-subtitle">{subtitle || "准备开始"}</p>
    <label>速度<select aria-label="播放速度" value={rate} onChange={(event) => onRate(Number(event.target.value))}><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option></select></label>
  </section>;
}
