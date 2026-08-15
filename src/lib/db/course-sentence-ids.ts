export function persistedCourseSentenceId(articleId: string, sourceSentenceId: string) {
  return `${articleId}::${sourceSentenceId}`;
}

export function publicCourseSentenceId(articleId: string, persistedSentenceId: string) {
  const prefix = `${articleId}::`;
  return persistedSentenceId.startsWith(prefix) ? persistedSentenceId.slice(prefix.length) : persistedSentenceId;
}
