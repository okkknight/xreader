import path from "node:path";

export function coursePaths(root: string, slug: string) {
  const directory = path.resolve(root, slug);
  return {
    directory,
    source: path.join(directory, "source", "article.md"),
    finalLecture: path.join(directory, "final", "lecture.md"),
    build: path.join(directory, "build", "course.json"),
    audio: path.join(directory, "audio"),
  };
}
