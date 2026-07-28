"use client";

type Props = { playing: boolean; rate: number; subtitle?: string; completed: boolean; position?: string; onPlayPause: () => void; onPrevious: () => void; onNext: () => void; onRate: (rate: number) => void };

export function PlayerBar({ playing, rate, subtitle, completed, position, onPlayPause, onPrevious, onNext, onRate }: Props) {
  return <section className="player-bar" aria-label="播放器" data-completed={completed ? "true" : "false"}>
    <div className="player-bar-inner">
      <div className="player-controls" aria-label="片段控制">
        <button className="transport-button" type="button" onClick={onPrevious} aria-label="上一段"><span aria-hidden="true">‹</span></button>
        <button type="button" className="play-button" onClick={onPlayPause} aria-label={playing ? "暂停" : "播放"}><span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span></button>
        <button className="transport-button" type="button" onClick={onNext} aria-label="下一段"><span aria-hidden="true">›</span></button>
      </div>
      <div className="player-track">
        <div className="player-track-meta"><span>{completed ? "讲解完成" : "跟读播放"}</span>{position ? <span className="player-position">{position}</span> : null}</div>
        <p className="player-subtitle">{completed ? "这一课已经听完了" : subtitle || "准备开始"}</p>
      </div>
      <label className="player-speed"><span>速度</span><select aria-label="播放速度" value={rate} onChange={(event) => onRate(Number(event.target.value))}><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option></select></label>
    </div>
  </section>;
}
