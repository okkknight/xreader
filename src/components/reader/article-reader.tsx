"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
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
  const [translations, setTranslations] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const controllerRef = useRef<AudioController | null>(null);
  const modeRef = useRef(state.mode);
  const pendingGuidedPlayRef = useRef<string | undefined>(undefined);
  const autoScrollingRef = useRef(false);
  const initialFollowRef = useRef(true);
  const sentences = useMemo(() => article.paragraphs.flatMap((paragraph) => paragraph.sentences), [article]);
  const queue = useMemo(() => state.mode === "GUIDED" ? buildGuidedQueue(article.lessonSegments) : buildReadingQueue(article.lessonSegments), [article.lessonSegments, state.mode]);
  const activeQueueIndex = queue.findIndex((item) => item.sentenceIds.includes(state.activeItemId || ""));
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const controller = new AudioController(audio, (item) => {
      if (!item) { createProgressStore(window.localStorage).save(article.id, { completed: true }); dispatch({ type: "SET_COMPLETED", completed: true }); return; }
      if (item.sentenceIds[0]) dispatch({ type: "SET_ACTIVE", itemId: item.sentenceIds[0] });
      createProgressStore(window.localStorage).save(article.id, modeRef.current === "GUIDED" ? { guidedSegmentId: item.id, completed: false } : { readingSentenceId: item.sentenceIds[0], completed: false });
      dispatch({ type: "SET_PLAYING", playing: true });
    });
    controller.setQueue(queue); controllerRef.current = controller;
    if (pendingGuidedPlayRef.current) {
      const item = queue.find((candidate) => candidate.sentenceIds.includes(pendingGuidedPlayRef.current!));
      pendingGuidedPlayRef.current = undefined;
      if (item) void controller.play(item.id).catch(() => dispatch({ type: "SET_PLAYING", playing: false }));
    }
    return () => { controller.pause(); controllerRef.current = null; };
  }, [article.id, queue]);
  useEffect(() => { modeRef.current = state.mode; }, [state.mode]);
  useEffect(() => {
    const progress = createProgressStore(window.localStorage).load(article.id);
    const item = state.mode === "GUIDED"
      ? queue.find((candidate) => candidate.id === progress?.guidedSegmentId)
      : queue.find((candidate) => candidate.sentenceIds.includes(progress?.readingSentenceId || ""));
    dispatch({ type: "RESTORE_PROGRESS", itemId: item?.sentenceIds[0], completed: Boolean(progress?.completed) });
  }, [article.id, queue, state.mode]);
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = state.rate; }, [state.rate]);
  useEffect(() => {
    if (!state.autoFollow || !state.activeItemId) return;
    if (initialFollowRef.current) { initialFollowRef.current = false; return; }
    const sentence = document.querySelector<HTMLElement>(`[data-sentence-id="${state.activeItemId}"]`);
    if (!sentence) return;
    autoScrollingRef.current = true;
    const reducedMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sentence.scrollIntoView?.({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
    const timeout = window.setTimeout(() => { autoScrollingRef.current = false; }, 400);
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
    const item = queue.find((candidate) => candidate.sentenceIds.includes(id));
    if (!item) { dispatch({ type: "SET_PLAYING", playing: false }); return; }
    dispatch({ type: "SET_PLAYING", playing: true });
    void controllerRef.current?.play(item.id).catch(() => dispatch({ type: "SET_PLAYING", playing: false }));
  };
  const togglePlayback = () => {
    if (state.playing) { controllerRef.current?.pause(); dispatch({ type: "SET_PLAYING", playing: false }); return; }
    const item = queue.find((candidate) => candidate.sentenceIds.includes(state.activeItemId || "")) || queue[0];
    if (!item) return;
    dispatch({ type: "SET_PLAYING", playing: true });
    void controllerRef.current?.play(item.id).catch(() => dispatch({ type: "SET_PLAYING", playing: false }));
  };
  const changeMode = (mode: "GUIDED" | "READING") => {
    if (mode === "GUIDED" && state.mode === "GUIDED") { if (sentences[0]) chooseSentence(state.activeItemId || sentences[0].id); return; }
    initialFollowRef.current = false;
    controllerRef.current?.pause();
    if (mode === "GUIDED") pendingGuidedPlayRef.current = state.activeItemId || sentences[0]?.id;
    dispatch({ type: "SET_MODE", mode });
  };
  const navigatePrevious = () => { controllerRef.current?.previous(); };
  const navigateNext = () => { controllerRef.current?.next(); };
  return <div className="reader-page">
    <article className="reader-main">
      <ReaderHeader article={article} mode={state.mode} onModeChange={changeMode} translations={translations} onToggleTranslations={() => setTranslations((value) => !value)} />
      <ArticleCanvas paragraphs={article.paragraphs} activeSentenceId={state.activeItemId} translations={translations} onSentenceSelect={chooseSentence} />
      {state.mode === "GUIDED" && !state.autoFollow ? <button className="resume-follow" type="button" onClick={() => dispatch({ type: "RESTORE_AUTO_FOLLOW" })}>回到当前讲解</button> : null}
    </article>
    <CurrentLessonPanel segments={article.lessonSegments} activeSentenceId={state.activeItemId} />
    <audio ref={audioRef} preload="metadata" />
    <PlayerBar playing={state.playing} rate={state.rate} completed={state.completed} position={activeQueueIndex >= 0 ? `${activeQueueIndex + 1} / ${queue.length}` : undefined} onPlayPause={togglePlayback} onPrevious={navigatePrevious} onNext={navigateNext} onRate={(rate) => dispatch({ type: "SET_RATE", rate })} />
  </div>;
}
