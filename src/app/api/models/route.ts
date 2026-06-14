import { NextResponse } from "next/server";
import { ollama } from "@/ai/ollama";

export async function GET() {
  try {
    const models = await ollama.listModels();
    return NextResponse.json({ models, ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "ollama_unreachable" },
      { status: 503 },
    );
  }
}
