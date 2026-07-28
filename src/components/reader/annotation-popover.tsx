"use client";

import { useState } from "react";
import type { PublicAnnotation } from "@/types/public-article";

export function AnnotationPopover({ annotation }: { annotation: PublicAnnotation }) {
  const [open, setOpen] = useState(false);
  return <span className="annotation">
    <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{annotation.text}</button>
    {open ? <span className="annotation-card" role="note"><strong>{annotation.meaningZh}</strong>{annotation.noteZh ? <span>{annotation.noteZh}</span> : null}</span> : null}
  </span>;
}
