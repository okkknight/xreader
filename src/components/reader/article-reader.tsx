"use client";

import { useMemo, useReducer } from "react";
import { playbackReducer, initialPlaybackState } from "@/features/reader/playback-reducer";
import type { PublicArticle } from "@/types/public-article";
import { ArticleBody } from "./article-body";
import { ModeSwitch } from "./mode-switch";
import { PlayerBar } from "@/components/player/player-bar";
import { GuidedSubtitle } from "@/components/player/guided-subtitle";

export function ArticleReader({ article }: { article: PublicArticle }) {
  const [state, dispatch] = useReducer(playbackReducer, initialPlaybackState);
  const sentences = useMemo(() => article.paragraphs.flatMap((paragraph) => paragraph.sentences), [article]);
  const active = sentences.find((sentence) => sentence.id === state.activeItemId);
  const chooseSentence = (id: string) => { dispatch({ type: "SET_ACTIVE", itemId: id }); dispatch({ type: "SET_PLAYING", playing: true }); };
  return <div className="reader-layout">
    <article className="article-column">
      <header className="article-heading"><p>{article.topic} · {article.difficulty}</p><h1>{article.titleEn}</h1><h2>{article.titleZh}</h2>{article.dekZh ? <p className="dek">{article.dekZh}</p> : null}<ModeSwitch mode={state.mode} onChange={(mode) => { dispatch({ type: "SET_MODE", mode }); if (mode === "GUIDED" && sentences[0]) chooseSentence(sentences[0].id); }} /></header>
      <ArticleBody paragraphs={article.paragraphs} activeSentenceId={state.activeItemId} onSentenceSelect={chooseSentence} />
      {state.mode === "GUIDED" && !state.autoFollow ? <button type="button" onClick={() => dispatch({ type: "RESTORE_AUTO_FOLLOW" })}>回到当前讲解</button> : null}
    </article>
    <aside className="lesson-rail" aria-label="讲解目录"><h2>这一课</h2>{article.lessonSegments.map((segment) => <button key={segment.id} type="button" className={state.activeItemId && segment.sentenceIds.includes(state.activeItemId) ? "is-current" : ""} onClick={() => segment.sentenceIds[0] && chooseSentence(segment.sentenceIds[0])}><span>{String(segment.order).padStart(2, "0")}</span><strong>{segment.type.replaceAll("_", " ")}</strong>{segment.script ? <small>{segment.script}</small> : null}</button>)}</aside>
    <GuidedSubtitle text={active?.text} />
    <PlayerBar playing={state.playing} rate={state.rate} subtitle={active?.text} onPlayPause={() => dispatch({ type: "SET_PLAYING", playing: !state.playing })} onRate={(rate) => dispatch({ type: "SET_RATE", rate })} />
  </div>;
}
