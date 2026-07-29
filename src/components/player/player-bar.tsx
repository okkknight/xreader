"use client";

import { ModeSwitch } from "@/components/reader/mode-switch";
import type { CSSProperties } from "react";
import { GuidedSubtitle } from "./guided-subtitle";
import type { CourseSubtitleCue } from "@/lib/course-blocks/types";

type Props = { playing: boolean; rate: number; completed: boolean; position?: string; mode: "GUIDED" | "READING"; subtitleCue?: CourseSubtitleCue; autoFollow?: boolean; canPrevious?: boolean; canNext?: boolean; onModeChange: (mode: "GUIDED" | "READING") => void; onRestoreFollow?: () => void; onPlayPause: () => void; onPrevious: () => void; onNext: () => void; onRate: (rate: number) => void };

export function PlayerBar({ playing, rate, completed, position, mode, subtitleCue, autoFollow = true, canPrevious = true, canNext = true, onModeChange, onRestoreFollow, onPlayPause, onPrevious, onNext, onRate }: Props) {
  const progressMatch = position?.match(/^(\d+)\s*\/\s*(\d+)$/);
  const progressValue = progressMatch ? Math.min(100, Math.round((Number(progressMatch[1]) / Number(progressMatch[2])) * 100)) : 0;

  return <><GuidedSubtitle cue={subtitleCue} paused={!playing} /><section className="reader-player-dock" aria-label="播放器" data-completed={completed ? "true" : "false"}>
    <div className="reader-player-inner">
      <div className="reader-player-left">
        <ModeSwitch mode={mode} onChange={onModeChange} className="reader-player-mode-switch" />
        {!autoFollow && onRestoreFollow ? <button className="reader-player-follow" type="button" aria-label="回到当前播放" onClick={onRestoreFollow}>跟随</button> : null}
      </div>
      <div className="reader-player-controls reader-player-center" aria-label="片段控制">
        <button className="reader-player-button" type="button" onClick={onPrevious} aria-label="上一段" disabled={!canPrevious}><span aria-hidden="true">‹</span></button>
        <button type="button" className="reader-play-button" onClick={onPlayPause} aria-label={completed ? "重新开始" : playing ? "暂停" : "播放"}><span aria-hidden="true">{completed ? "↻" : playing ? "Ⅱ" : "▶"}</span></button>
        <button className="reader-player-button" type="button" onClick={onNext} aria-label="下一段" disabled={!canNext}><span aria-hidden="true">›</span></button>
      </div>
      <label className="reader-player-speed"><span>速度</span><select aria-label="播放速度" value={rate} onChange={(event) => onRate(Number(event.target.value))}><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option></select></label>
    </div>
    <div className="reader-player-progress" role="progressbar" aria-label="播放进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressValue} aria-valuetext={position ?? "尚未开始"}><span style={{ "--reader-player-progress": `${progressValue}%` } as CSSProperties} /></div>
  </section></>;
}
