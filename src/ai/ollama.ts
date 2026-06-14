import { env } from "@/lib/env";

export interface OllamaModel {
  name: string;
  size?: number;
  modified_at?: string;
  digest?: string;
  details?: {
    format?: string;
    family?: string;
    parameter_size?: string;
    quantization_level?: string;
  };
}

export interface OllamaTagsResponse {
  models: OllamaModel[];
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  options?: Record<string, unknown>;
  format?: "json" | { type: string };
  keep_alive?: string;
}

export interface ChatChunk {
  model: string;
  created_at: string;
  message: { role: "assistant"; content: string };
  done: boolean;
  done_reason?: string;
  total_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface EmbedRequest {
  model: string;
  prompt: string;
}

export interface EmbedResponse {
  embedding: number[];
}

class OllamaError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "OllamaError";
    this.status = status;
  }
}

async function fetchOllama<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${env.ollamaBaseUrl}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new OllamaError(
      `Ollama ${init.method ?? "GET"} ${path} failed: ${res.status} ${res.statusText} ${text}`,
      res.status,
    );
  }
  return (await res.json()) as T;
}

export const ollama = {
  /**
   * Health check. Returns true if the Ollama server is reachable.
   */
  async ping(): Promise<boolean> {
    try {
      await fetchOllama("/api/tags");
      return true;
    } catch {
      return false;
    }
  },

  async listModels(): Promise<OllamaModel[]> {
    const res = await fetchOllama<OllamaTagsResponse>("/api/tags");
    return res.models ?? [];
  },

  async *chatStream(req: ChatRequest): AsyncGenerator<ChatChunk> {
    const url = `${env.ollamaBaseUrl}/api/chat`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stream: true, ...req }),
    });
    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      throw new OllamaError(
        `Ollama chat failed: ${res.status} ${res.statusText} ${text}`,
        res.status,
      );
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          yield JSON.parse(trimmed) as ChatChunk;
        } catch {
          // ignore malformed lines
        }
      }
    }
  },

  async chat(req: ChatRequest): Promise<string> {
    let out = "";
    for await (const chunk of ollama.chatStream(req)) {
      out += chunk.message?.content ?? "";
    }
    return out;
  },

  async embed(req: EmbedRequest): Promise<number[]> {
    const res = await fetchOllama<EmbedResponse>("/api/embeddings", {
      method: "POST",
      body: JSON.stringify(req),
    });
    return res.embedding;
  },
};

export { OllamaError };
