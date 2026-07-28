"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";
import { playbackReducer, initialPlaybackState } from "@/features/reader/playback-reducer";
import { AudioController } from "@/features/reader/audio-controller";
import { buildGuidedQueue, buildReadingQueue } from "@/features/reader/queue";
import { createProgressStore } from "@/features/reader/progress";
import type { PublicArticle } from "@/types/public-article";
import { ArticleBody } from "./article-body";
import { ModeSwitch } from "./mode-switch";
import { PlayerBar } from "@/components/player/player-bar";
import { GuidedSubtitle } from "@/components/player/guided-subtitle";

export function ArticleReader({ article }: { article: PublicArticle }) {
  const [state, dispatch] = useReducer(playbackReducer, initialPlaybackState);
  const audioRef = useRef<HTMLAudioElement>(null);
  const controllerRef = useRef<AudioController | null>(null);
  const modeRef = useRef(state.mode);
  const pendingGuidedPlayRef = useRef<string | undefined>(undefined);
  const autoScrollingRef = useRef(false);
  const sentences = useMemo(() => article.paragraphs.flatMap((paragraph) => paragraph.sentences), [article]);
  const queue = useMemo(() => state.mode === "GUIDED" ? buildGuidedQueue(article.lessonSegments) : buildReadingQueue(article.lessonSegments), [article.lessonSegments, state.mode]);
  const active = sentences.find((sentence) => sentence.id === state.activeItemId);
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
    if (progress?.completed) dispatch({ type: "SET_COMPLETED", completed: true });
    const item = state.mode === "GUIDED"
      ? queue.find((candidate) => candidate.id === progress?.guidedSegmentId)
      : queue.find((candidate) => candidate.sentenceIds.includes(progress?.readingSentenceId || ""));
    if (item?.sentenceIds[0]) dispatch({ type: "SET_ACTIVE", itemId: item.sentenceIds[0] });
  }, [article.id, queue, state.mode]);
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = state.rate; }, [state.rate]);
  useEffect(() => {
    if (!state.autoFollow || !state.activeItemId) return;
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
    controllerRef.current?.pause();
    if (mode === "GUIDED") pendingGuidedPlayRef.current = state.activeItemId || sentences[0]?.id;
    dispatch({ type: "SET_MODE", mode });
  };
  return <div className="reader-layout">
    <article className="article-column">
      <header className="article-heading"><p>{article.topic} · {article.difficulty}</p><h1>{article.titleEn}</h1><h2>{article.titleZh}</h2>{article.dekZh ? <p className="dek">{article.dekZh}</p> : null}<ModeSwitch mode={state.mode} onChange={changeMode} /></header>
      <ArticleBody paragraphs={article.paragraphs} activeSentenceId={state.activeItemId} onSentenceSelect={chooseSentence} />
      {state.mode === "GUIDED" && !state.autoFollow ? <button type="button" onClick={() => dispatch({ type: "RESTORE_AUTO_FOLLOW" })}>回到当前讲解</button> : null}
    </article>
    <aside className="lesson-rail" aria-label="讲解目录"><h2>这一课</h2>{article.lessonSegments.map((segment) => <button key={segment.id} type="button" className={state.activeItemId && segment.sentenceIds.includes(state.activeItemId) ? "is-current" : ""} onClick={() => segment.sentenceIds[0] && chooseSentence(segment.sentenceIds[0])}><span>{String(segment.order).padStart(2, "0")}</span><strong>{segment.type.replaceAll("_", " ")}</strong>{segment.script ? <small>{segment.script}</small> : null}</button>)}</aside>
    <GuidedSubtitle text={active?.text} />
    <audio ref={audioRef} preload="metadata" />
    <PlayerBar playing={state.playing} rate={state.rate} subtitle={active?.text} completed={state.completed} onPlayPause={togglePlayback} onPrevious={() => controllerRef.current?.previous()} onNext={() => controllerRef.current?.next()} onRate={(rate) => dispatch({ type: "SET_RATE", rate })} />
  </div>;
}
