import lemmatize from "wink-lemmatizer";

export function wordFormCandidates(word: string) {
  const lower = word.toLocaleLowerCase();
  const candidates = new Set([lower]);
  candidates.add(lemmatize.noun(lower));
  candidates.add(lemmatize.verb(lower));
  candidates.add(lemmatize.adjective(lower));
  return candidates;
}

export function wordsEquivalent(left: string, right: string) {
  const leftCandidates = wordFormCandidates(left);
  return [...wordFormCandidates(right)].some((candidate) => leftCandidates.has(candidate));
}
