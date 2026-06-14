/**
 * Centralized environment access. Throws on missing required vars in
 * production. Reads from process.env (Next.js loads .env automatically).
 */
function required(key: string, fallback?: string): string {
  const v = process.env[key] ?? fallback;
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function numberEnv(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`Invalid number env: ${key}=${v}`);
  return n;
}

export const env = {
  ollamaBaseUrl: optional("OLLAMA_BASE_URL", "http://localhost:11434"),
  defaultModel: optional("DEFAULT_MODEL", "llama3.1:8b"),
  embeddingModel: optional("EMBEDDING_MODEL", "nomic-embed-text"),
  ragTopK: numberEnv("RAG_TOP_K", 8),
  databaseUrl: required("DATABASE_URL", "file:./dev.db"),
  imageProviderUrl: optional("IMAGE_PROVIDER_URL", ""),
  imageProviderToken: optional("IMAGE_PROVIDER_TOKEN", ""),
  sttProviderUrl: optional("STT_PROVIDER_URL", ""),
  ttsProviderUrl: optional("TTS_PROVIDER_URL", ""),
  appName: optional("APP_NAME", "AI Dungeon Master"),
} as const;
