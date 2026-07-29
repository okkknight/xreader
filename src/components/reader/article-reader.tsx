"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { playbackReducer, initialPlaybackState } from "@/features/reader/playback-reducer";
import { AudioController } from "@/features/reader/audio-controller";
import { buildGuidedQueue, buildReadingQueue } from "@/features/reader/queue";
import { createProgressStore } from "@/features/reader/progress";
import type { PublicArticle } from "@/types/public-article";
import { ArticleCanvas } from "./article-canvas";
import { ReaderHeader } from "./reader-header";
import { PlayerBar } from "@/components/player/player-bar";
import type { CourseHighlightCue, CourseSubtitleCue } from "@/lib/course-blocks/types";
import { activeHighlightCuesAtTime } from "@/lib/audio/highlight-cues";
import { activeSubtitleCueAtTime } from "@/lib/audio/subtitle-cues";
import { isSentenceComfortablyVisible } from "@/lib/reader/auto-follow";
import { readerShortcutForKey } from "@/lib/reader/keyboard-shortcuts";

type HighlightWithTone = Pick<CourseHighlightCue, "id" | "sourceStart" | "sourceEnd"> & { tone?: number };
type SeenHighlight = HighlightWithTone & { sentenceId: string; tone?: number };

export function ArticleReader({ article, initialMode }: { article: PublicArticle; initialMode?: "GUIDED" | "READING" }) {
  const [state, dispatch] = useReducer(playbackReducer, { ...initialPlaybackState, mode: initialMode ?? "GUIDED" });
  const audioRef = useRef<HTMLAudioElement>(null);
  const controllerRef = useRef<AudioController | null>(null);
  const modeRef = useRef(state.mode);
  const activeItemRef = useRef(state.activeSentenceId);
  const pendingPlayRef = useRef<string | undefined>(undefined);
  const autoScrollingRef = useRef(false);
  const seenHighlightSentenceRef = useRef<string | undefined>(undefined);
  const seenTitleBlockRef = useRef<string | undefined>(undefined);
  const playingItemIdRef = useRef<string | undefined>(undefined);
  const [activeHighlightCues, setActiveHighlightCues] = useState<CourseHighlightCue[]>([]);
  const [seenHighlights, setSeenHighlights] = useState<SeenHighlight[]>([]);
  const [seenTitleHighlights, setSeenTitleHighlights] = useState<HighlightWithTone[]>([]);
  const [activeSubtitleCue, setActiveSubtitleCue] = useState<CourseSubtitleCue | undefined>();
  const sentences = useMemo(() => article.paragraphs.flatMap((paragraph) => paragraph.sentences), [article]);
  const readingQueue = useMemo(() => buildReadingQueue(sentences), [sentences]);
  const guidedQueue = useMemo(() => buildGuidedQueue(article.courseBlocks), [article.courseBlocks]);
  const queue = state.mode === "GUIDED" ? guidedQueue : readingQueue;
  const activeQueueIndex = queue.findIndex((item) => item.id === state.activeItemId || item.sentenceIds.includes(state.activeSentenceId || ""));
  const activeGuidedBlock = useMemo(() => state.mode === "GUIDED" ? article.courseBlocks.find((block) => block.id === state.activeItemId) : undefined, [article.courseBlocks, state.activeItemId, state.mode]);

  useEffect(() => { modeRef.current = state.mode; activeItemRef.current = state.activeSentenceId; }, [state.mode, state.activeSentenceId]);
  useEffect(() => {
    const audio = audioRef.current;
      if (!audio) return;
      const controller = new AudioController(audio, (item) => {
      setActiveHighlightCues([]);
      setActiveSubtitleCue(undefined);
      if (!item) { playingItemIdRef.current = undefined; seenHighlightSentenceRef.current = undefined; seenTitleBlockRef.current = undefined; setSeenHighlights([]); setSeenTitleHighlights([]); createProgressStore(window.localStorage).save(article.id, { completed: true, lastMode: modeRef.current }); dispatch({ type: "CLEAR_ACTIVE" }); dispatch({ type: "SET_COMPLETED", completed: true }); return; }
      playingItemIdRef.current = item.id;
      const currentBlock = article.courseBlocks.find((block) => block.id === item.id);
      if (currentBlock?.type === "title") {
        if (seenTitleBlockRef.current !== item.id) { seenTitleBlockRef.current = item.id; setSeenTitleHighlights([]); }
      } else { seenTitleBlockRef.current = undefined; setSeenTitleHighlights([]); }
      const sentenceId = item.sentenceIds[0];
      if (seenHighlightSentenceRef.current !== sentenceId) { seenHighlightSentenceRef.current = sentenceId; setSeenHighlights([]); }
      const activeSentence = item.sentenceIds[0];
      dispatch({ type: "SET_ACTIVE", itemId: item.id, sentenceId: activeSentence });
      createProgressStore(window.localStorage).save(article.id, modeRef.current === "GUIDED" ? { guidedBlockId: item.id, lastMode: "GUIDED", completed: false } : { readingSentenceId: activeSentence, lastMode: "READING", completed: false });
      dispatch({ type: "SET_PLAYING", playing: true });
    }, (item, currentTimeMs) => {
      if (item.id !== playingItemIdRef.current) return;
      const highlightCues = activeHighlightCuesAtTime(item.highlightCues ?? [], currentTimeMs);
      setActiveHighlightCues((current) => current.length === highlightCues.length && current.every((cue, index) => cue.id === highlightCues[index].id) ? current : highlightCues);
      const currentBlock = article.courseBlocks.find((block) => block.id === item.id);
      const subtitleCue = currentBlock ? activeSubtitleCueAtTime(currentBlock.subtitleCues ?? [], currentTimeMs) : undefined;
      if (subtitleCue) setActiveSubtitleCue((current) => current?.id === subtitleCue.id ? current : subtitleCue);
      if (currentBlock?.type === "title" && seenTitleBlockRef.current === item.id) {
        const teachingHighlights = highlightCues.filter((cue) => !cue.id.endsWith("-original-read"));
        if (teachingHighlights.length) {
          const cue = teachingHighlights.at(-1)!;
          setSeenTitleHighlights([{ id: cue.id, sourceStart: cue.sourceStart, sourceEnd: cue.sourceEnd, tone: undefined }]);
        }
      }
      if (seenHighlightSentenceRef.current === item.sentenceIds[0] && item.sentenceIds[0]) {
        const teachingHighlights = highlightCues.filter((cue) => !cue.id.endsWith("-original-read"));
        if (teachingHighlights.length) {
          const cue = teachingHighlights.at(-1)!;
          setSeenHighlights([{ id: cue.id, sourceStart: cue.sourceStart, sourceEnd: cue.sourceEnd, sentenceId: item.sentenceIds[0], tone: undefined }]);
        }
      }
      const range = item.sentenceRanges?.find((candidate) => currentTimeMs >= candidate.startMs && currentTimeMs < candidate.endMs);
      if (range && range.sentenceId !== activeItemRef.current) dispatch({ type: "SET_ACTIVE", itemId: item.id, sentenceId: range.sentenceId });
    });
    controller.setQueue(queue); controllerRef.current = controller;
    if (pendingPlayRef.current) {
      const item = queue.find((candidate) => candidate.id === pendingPlayRef.current || candidate.sentenceIds.includes(pendingPlayRef.current!));
      pendingPlayRef.current = undefined;
      if (item) void controller.play(item.id).catch(() => dispatch({ type: "SET_PLAYING", playing: false }));
    }
    return () => { controller.pause(); controllerRef.current = null; };
  }, [article.courseBlocks, article.id, queue]);
  useEffect(() => {
    const progress = createProgressStore(window.localStorage).load(article.id);
    const mode = initialMode ?? progress?.lastMode ?? "GUIDED";
    const restoreQueue = mode === "GUIDED" ? guidedQueue : readingQueue;
    const item = restoreQueue.find((candidate) => candidate.id === progress?.guidedBlockId || candidate.id === progress?.readingSentenceId || candidate.sentenceIds.includes(progress?.readingSentenceId ?? ""));
    dispatch({ type: "RESTORE_PROGRESS", mode, itemId: item?.id, sentenceId: item?.sentenceIds[0], completed: Boolean(progress?.completed) });
  }, [article.id, guidedQueue, initialMode, readingQueue]);
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = state.rate; }, [state.rate]);
  useEffect(() => {
    if (!state.autoFollow || !state.activeSentenceId) return;
    const sentence = document.querySelector<HTMLElement>(`[data-sentence-id="${state.activeSentenceId}"]`);
    if (!sentence) return;
    const rect = sentence.getBoundingClientRect();
    if (isSentenceComfortablyVisible(rect, window.innerHeight)) return;
    autoScrollingRef.current = true;
    const reducedMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sentence.scrollIntoView?.({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
    const timeout = window.setTimeout(() => { autoScrollingRef.current = false; }, reducedMotion ? 100 : 900);
    return () => window.clearTimeout(timeout);
  }, [state.activeSentenceId, state.autoFollow]);
  useEffect(() => {
    const stopFollowing = () => {
      if (!state.playing || autoScrollingRef.current || !state.activeSentenceId) return;
      const sentence = document.querySelector<HTMLElement>(`[data-sentence-id="${state.activeSentenceId}"]`);
      if (!sentence || !isSentenceComfortablyVisible(sentence.getBoundingClientRect(), window.innerHeight)) dispatch({ type: "USER_SCROLLED_AWAY" });
    };
    window.addEventListener("scroll", stopFollowing, { passive: true });
    return () => window.removeEventListener("scroll", stopFollowing);
  }, [state.activeSentenceId, state.playing]);

  const chooseSentence = (id: string) => {
    const item = queue.find((candidate) => candidate.id === id || candidate.sentenceIds.includes(id));
    setActiveHighlightCues([]);
    setActiveSubtitleCue(undefined);
    setSeenHighlights([]);
    setSeenTitleHighlights([]);
    seenHighlightSentenceRef.current = undefined;
    seenTitleBlockRef.current = undefined;
    playingItemIdRef.current = item?.id;
    dispatch({ type: "RESTORE_AUTO_FOLLOW" });
    dispatch({ type: "SET_ACTIVE", itemId: item?.id ?? id, sentenceId: id });
    if (!item) { dispatch({ type: "SET_PLAYING", playing: false }); return; }
    dispatch({ type: "SET_PLAYING", playing: true });
    void controllerRef.current?.play(item.id, { restart: true }).catch(() => dispatch({ type: "SET_PLAYING", playing: false }));
  };
  const togglePlayback = useCallback(() => {
    if (state.playing) { controllerRef.current?.pause(); dispatch({ type: "SET_PLAYING", playing: false }); return; }
    const item = queue.find((candidate) => candidate.id === state.activeItemId || candidate.sentenceIds.includes(state.activeSentenceId || "")) || queue[0];
    if (!item) return;
    playingItemIdRef.current = item.id;
    dispatch({ type: "SET_PLAYING", playing: true });
    void controllerRef.current?.play(item.id).catch(() => dispatch({ type: "SET_PLAYING", playing: false }));
  }, [queue, state.activeItemId, state.activeSentenceId, state.playing]);
  const changeMode = (mode: "GUIDED" | "READING") => {
    if (mode === state.mode) return;
    const targetQueue = mode === "GUIDED" ? guidedQueue : readingQueue;
    const target = targetQueue.find((candidate) => candidate.id === state.activeItemId || candidate.sentenceIds.includes(state.activeSentenceId || "")) || targetQueue[0];
    const shouldResume = state.playing;
    controllerRef.current?.pause();
    pendingPlayRef.current = shouldResume ? target?.id : undefined;
    createProgressStore(window.localStorage).save(article.id, mode === "GUIDED" ? { guidedBlockId: target?.id, lastMode: mode, completed: false } : { readingSentenceId: target?.sentenceIds[0], lastMode: mode, completed: false });
    dispatch({ type: "SET_MODE", mode });
    dispatch({ type: "SET_ACTIVE", itemId: target?.id, sentenceId: target?.sentenceIds[0] });
  };
  const chooseTitle = () => {
    const titleBlock = article.courseBlocks.find((block) => block.type === "title");
    if (!titleBlock) return;
    if (state.mode === "GUIDED") { chooseSentence(titleBlock.id); return; }
    controllerRef.current?.pause();
    pendingPlayRef.current = titleBlock.id;
    dispatch({ type: "SET_MODE", mode: "GUIDED" });
  };
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const shortcut = readerShortcutForKey({ key: event.key, targetTagName: target?.tagName, isContentEditable: target?.isContentEditable, altKey: event.altKey, ctrlKey: event.ctrlKey, metaKey: event.metaKey, shiftKey: event.shiftKey });
      if (!shortcut) return;
      event.preventDefault();
      if (shortcut === "toggle") togglePlayback();
      if (shortcut === "previous") controllerRef.current?.previous();
      if (shortcut === "next") controllerRef.current?.next();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlayback]);
  return <div className="reader-page">
    <article className="reader-main">
      <ReaderHeader article={article} onTitleSelect={chooseTitle} activeHighlights={activeGuidedBlock?.type === "title" ? activeHighlightCues.map((cue) => ({ ...cue, tone: undefined })) : []} seenHighlights={activeGuidedBlock?.type === "title" && state.mode === "GUIDED" ? seenTitleHighlights : []} />
      <ArticleCanvas paragraphs={article.paragraphs} activeSentenceId={state.activeSentenceId} activeHighlights={activeGuidedBlock?.sentenceId ? activeHighlightCues.map((cue) => ({ ...cue, sentenceId: activeGuidedBlock.sentenceId!, tone: undefined })) : []} seenHighlights={state.mode === "GUIDED" ? seenHighlights.filter((highlight) => highlight.sentenceId === state.activeSentenceId) : []} translations={false} onSentenceSelect={chooseSentence} />
    </article>
    <audio ref={audioRef} preload="metadata" />
    <PlayerBar playing={state.playing} rate={state.rate} completed={state.completed} position={activeQueueIndex >= 0 ? `${activeQueueIndex + 1} / ${queue.length}` : undefined} mode={state.mode} subtitleCue={state.mode === "GUIDED" ? activeSubtitleCue : undefined} autoFollow={state.autoFollow} canPrevious={activeQueueIndex > 0} canNext={!state.completed && activeQueueIndex < queue.length - 1} onModeChange={changeMode} onRestoreFollow={() => dispatch({ type: "RESTORE_AUTO_FOLLOW" })} onPlayPause={togglePlayback} onPrevious={() => controllerRef.current?.previous()} onNext={() => controllerRef.current?.next()} onRate={(rate) => dispatch({ type: "SET_RATE", rate })} />
  </div>;
}
