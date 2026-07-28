export type AiConfig = { apiKey: string; model: string; baseUrl?: string };

export function getAiConfig(env: NodeJS.ProcessEnv = process.env): AiConfig {
  const apiKey = env.OPENAI_COMPATIBLE_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_COMPATIBLE_API_KEY is required for generation");
  return { apiKey, model: env.OPENAI_COMPATIBLE_MODEL?.trim() || "gpt-4.1-mini", baseUrl: env.OPENAI_COMPATIBLE_BASE_URL?.trim() || undefined };
}
