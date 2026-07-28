import type { PublicArticle } from "@/types/public-article";
import { ModeSwitch } from "./mode-switch";

type Props = { article: PublicArticle; mode: "GUIDED" | "READING"; onModeChange: (mode: "GUIDED" | "READING") => void };

export function ReaderHeader({ article, mode, onModeChange }: Props) {
  return <header className="reader-header">
    <div className="reader-kicker">{article.topic} <span aria-hidden="true">·</span> {article.difficulty}</div>
    <h1>{article.titleEn}</h1>
    <h2>{article.titleZh}</h2>
    {article.dekZh ? <p className="reader-dek">{article.dekZh}</p> : null}
    <div className="reader-header-tools"><ModeSwitch mode={mode} onChange={onModeChange} /></div>
  </header>;
}
