"use client";

type Props = { playing: boolean; rate: number; completed: boolean; position?: string; onPlayPause: () => void; onPrevious: () => void; onNext: () => void; onRate: (rate: number) => void };

export function PlayerBar({ playing, rate, completed, position, onPlayPause, onPrevious, onNext, onRate }: Props) {
  return <section className="reader-player-dock" aria-label="播放器" data-completed={completed ? "true" : "false"}>
    <div className="reader-player-inner">
      <div className="reader-player-controls" aria-label="片段控制">
        <button className="reader-player-button" type="button" onClick={onPrevious} aria-label="上一段"><span aria-hidden="true">‹</span></button>
        <button type="button" className="reader-play-button" onClick={onPlayPause} aria-label={playing ? "暂停" : "播放"}><span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span></button>
        <button className="reader-player-button" type="button" onClick={onNext} aria-label="下一段"><span aria-hidden="true">›</span></button>
      </div>
      <div className="reader-player-status">
        <span>{completed ? "完成" : "讲解"}</span>
        {position ? <span className="reader-player-position">{position}</span> : null}
      </div>
      <label className="reader-player-speed"><span>速度</span><select aria-label="播放速度" value={rate} onChange={(event) => onRate(Number(event.target.value))}><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option></select></label>
    </div>
  </section>;
}
