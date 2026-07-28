"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";
import { playbackReducer, initialPlaybackState } from "@/features/reader/playback-reducer";
import { AudioController } from "@/features/reader/audio-controller";
import { buildGuidedQueue, buildReadingQueue } from "@/features/reader/queue";
import { createProgressStore } from "@/features/reader/progress";
import type { PublicArticle } from "@/types/public-article";
import { ArticleCanvas } from "./article-canvas";
import { ReaderHeader } from "./reader-header";
import { CurrentLessonPanel } from "./current-lesson-panel";
import { PlayerBar } from "@/components/player/player-bar";

export function ArticleReader({ article, initialMode = "GUIDED" }: { article: PublicArticle; initialMode?: "GUIDED" | "READING" }) {
  const [state, dispatch] = useReducer(playbackReducer, { ...initialPlaybackState, mode: initialMode });
  const audioRef = useRef<HTMLAudioElement>(null);
  const controllerRef = useRef<AudioController | null>(null);
  const modeRef = useRef(state.mode);
  const activeItemRef = useRef(state.activeItemId);
  const pendingPlayRef = useRef<string | undefined>(undefined);
  const autoScrollingRef = useRef(false);
  const initialFollowRef = useRef(true);
  const sentences = useMemo(() => article.paragraphs.flatMap((paragraph) => paragraph.sentences), [article]);
  const readingQueue = useMemo(() => buildReadingQueue(sentences), [sentences]);
  const guidedQueue = useMemo(() => buildGuidedQueue(article.paragraphGuides), [article.paragraphGuides]);
  const queue = state.mode === "GUIDED" ? guidedQueue : readingQueue;
  const activeQueueIndex = queue.findIndex((item) => item.id === state.activeItemId || item.sentenceIds.includes(state.activeItemId || ""));

  useEffect(() => { modeRef.current = state.mode; activeItemRef.current = state.activeItemId; }, [state.mode, state.activeItemId]);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const controller = new AudioController(audio, (item) => {
      if (!item) { createProgressStore(window.localStorage).save(article.id, { completed: true }); dispatch({ type: "SET_COMPLETED", completed: true }); return; }
      const activeSentence = item.sentenceIds[0];
      if (activeSentence) dispatch({ type: "SET_ACTIVE", itemId: activeSentence });
      createProgressStore(window.localStorage).save(article.id, modeRef.current === "GUIDED" ? { guidedParagraphId: item.id, completed: false } : { readingSentenceId: activeSentence, completed: false });
      dispatch({ type: "SET_PLAYING", playing: true });
    }, (item, currentTimeMs) => {
      const range = item.sentenceRanges?.find((candidate) => currentTimeMs >= candidate.startMs && currentTimeMs < candidate.endMs);
      if (range && range.sentenceId !== activeItemRef.current) dispatch({ type: "SET_ACTIVE", itemId: range.sentenceId });
    });
    controller.setQueue(queue); controllerRef.current = controller;
    if (pendingPlayRef.current) {
      const item = queue.find((candidate) => candidate.id === pendingPlayRef.current || candidate.sentenceIds.includes(pendingPlayRef.current!));
      pendingPlayRef.current = undefined;
      if (item) void controller.play(item.id).catch(() => dispatch({ type: "SET_PLAYING", playing: false }));
    }
    return () => { controller.pause(); controllerRef.current = null; };
  }, [article.id, queue]);
  useEffect(() => {
    const progress = createProgressStore(window.localStorage).load(article.id);
    const item = state.mode === "GUIDED" ? queue.find((candidate) => candidate.id === progress?.guidedParagraphId) : queue.find((candidate) => candidate.id === progress?.readingSentenceId);
    dispatch({ type: "RESTORE_PROGRESS", itemId: item?.sentenceIds[0] || item?.id, completed: Boolean(progress?.completed) });
  }, [article.id, queue, state.mode]);
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = state.rate; }, [state.rate]);
  useEffect(() => {
    if (!state.autoFollow || !state.activeItemId) return;
    if (initialFollowRef.current) { initialFollowRef.current = false; return; }
    const sentence = document.querySelector<HTMLElement>(`[data-sentence-id="${state.activeItemId}"]`);
    if (!sentence) return;
    const rect = sentence.getBoundingClientRect();
    const viewportMargin = Math.min(160, window.innerHeight * 0.2);
    const isComfortablyVisible = rect.top >= viewportMargin && rect.bottom <= window.innerHeight - viewportMargin;
    if (isComfortablyVisible) return;
    autoScrollingRef.current = true;
    const reducedMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sentence.scrollIntoView?.({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
    const timeout = window.setTimeout(() => { autoScrollingRef.current = false; }, reducedMotion ? 100 : 900);
    return () => window.clearTimeout(timeout);
  }, [state.activeItemId, state.autoFollow]);
  useEffect(() => {
    const handleScroll = () => { if (state.playing && !autoScrollingRef.current) dispatch({ type: "USER_SCROLLED_AWAY" }); };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [state.playing]);

  const chooseSentence = (id: string) => {
    initialFollowRef.current = false;
    dispatch({ type: "SET_ACTIVE", itemId: id });
    const item = queue.find((candidate) => candidate.id === id || candidate.sentenceIds.includes(id));
    if (!item) { dispatch({ type: "SET_PLAYING", playing: false }); return; }
    dispatch({ type: "SET_PLAYING", playing: true });
    void controllerRef.current?.play(item.id).catch(() => dispatch({ type: "SET_PLAYING", playing: false }));
  };
  const togglePlayback = () => {
    if (state.playing) { controllerRef.current?.pause(); dispatch({ type: "SET_PLAYING", playing: false }); return; }
    const item = queue.find((candidate) => candidate.id === state.activeItemId || candidate.sentenceIds.includes(state.activeItemId || "")) || queue[0];
    if (!item) return;
    dispatch({ type: "SET_PLAYING", playing: true });
    void controllerRef.current?.play(item.id).catch(() => dispatch({ type: "SET_PLAYING", playing: false }));
  };
  const changeMode = (mode: "GUIDED" | "READING") => {
    initialFollowRef.current = false;
    if (mode === state.mode) { const current = queue.find((candidate) => candidate.id === state.activeItemId || candidate.sentenceIds.includes(state.activeItemId || "")) || queue[0]; if (current) chooseSentence(current.sentenceIds[0] || current.id); return; }
    controllerRef.current?.pause();
    if (mode !== state.mode) pendingPlayRef.current = state.activeItemId;
    dispatch({ type: "SET_MODE", mode });
  };
  return <div className="reader-page">
    <article className="reader-main">
      <ReaderHeader article={article} mode={state.mode} onModeChange={changeMode} />
      <ArticleCanvas paragraphs={article.paragraphs} activeSentenceId={state.activeItemId} translations={false} onSentenceSelect={chooseSentence} />
      {state.mode === "GUIDED" && !state.autoFollow ? <button className="resume-follow" type="button" onClick={() => dispatch({ type: "RESTORE_AUTO_FOLLOW" })}>回到当前讲解</button> : null}
    </article>
    <CurrentLessonPanel guides={article.paragraphGuides} activeSentenceId={state.activeItemId} />
    <audio ref={audioRef} preload="metadata" />
    <PlayerBar playing={state.playing} rate={state.rate} completed={state.completed} position={activeQueueIndex >= 0 ? `${activeQueueIndex + 1} / ${queue.length}` : undefined} onPlayPause={togglePlayback} onPrevious={() => controllerRef.current?.previous()} onNext={() => controllerRef.current?.next()} onRate={(rate) => dispatch({ type: "SET_RATE", rate })} />
  </div>;
}
