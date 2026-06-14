# Architecture

## High-level diagram

```
                     ┌─────────────────────────────────────┐
                     │  Browser (Next.js client)           │
                     │  - Tailwind / shadcn-style UI       │
                     │  - Streaming chat (SSE)             │
                     │  - Optimistic player messages       │
                     └────────────────┬────────────────────┘
                                      │ fetch + SSE
                                      ▼
        ┌────────────────────────────────────────────────────────┐
        │  Next.js server (Node 20)                              │
        │                                                        │
        │  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐   │
        │  │ API routes  │  │ RAG retrieve│  │ AI orchestrator│   │
        │  │ (REST + SSE)│  │ (embeddings)│  │ (prompt modes) │   │
        │  └──────┬──────┘  └──────┬──────┘  └───────┬────────┘   │
        │         │                │                  │            │
        │  ┌──────▼──────┐  ┌──────▼──────┐  ┌───────▼────────┐   │
        │  │ Repos       │  │ Ollama      │  │ Zod validators │   │
        │  │ (Prisma)    │  │  client     │  │ (effects)      │   │
        │  └──────┬──────┘  └─────────────┘  └────────────────┘   │
        │         │                                                │
        │  ┌──────▼──────┐  ┌─────────────┐  ┌────────────────┐   │
        │  │ Dice engine │  │ Rules engine│  │ Combat engine  │   │
        │  │ (pure fns)  │  │ (modular)   │  │ (FSM)          │   │
        │  └─────────────┘  └─────────────┘  └────────────────┘   │
        └──────────────┬──────────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐         ┌──────────────────────┐
              │ SQLite + Prisma│         │ Ollama (separate    │
              │  (file)        │         │  process)            │
              └────────────────┘         └──────────────────────┘
```

## Why this shape

- **Engines are pure, framework-free modules.** Dice, rules, and combat can be unit-tested with no Prisma, no Ollama, no Next.js. That makes them easy to reason about and reuse.
- **Server is the only writer to game state.** The client posts a player turn; the server decides dice, damage, conditions. The model can *suggest* an effect via structured output, but the zod-validated server is the source of truth.
- **RAG is an in-process function today, swappable tomorrow.** v1 uses SQLite-stored Float32 embeddings + cosine similarity. The same `retrieve()` interface works with Chroma or FAISS.
- **Streaming is end-to-end.** The server forwards Ollama's `text/event-stream` chunks to the browser verbatim, while a second pass persists the final structured output as a `Message` and writes any `addMemory` effects.

## AI safety boundaries

- The model never resolves dice or damage directly. It emits `rollDice` / `applyDamage` / `addCondition` / `startCombat` / `endCombat` / `addMemory` effects that the server applies in `applyEffects()` inside `src/app/api/dm/chat/route.ts`.
- All effects are validated against a strict zod schema (`src/ai/validators.ts`). Bad effects are dropped silently; the DM still gets a fallback narration.
- The apply pipeline is bounded: a maximum of 5 `addMemory` effects per turn (each triggers an Ollama embedding call) and `addMemory.refs` is restricted to `{ npcId?, questId?, locationId? }`.
- Lore/memory is injected as a clearly delimited context block. The system prompt is hard-coded (or user-overridden in Settings) and is not re-injected through user-controlled data paths.

## Folder map

| Path | Purpose |
|---|---|
| `src/engine/dice` | Pure dice roller. `parseDice`, `roll`, advantage/disadvantage. |
| `src/engine/rules` | Ability/skill/save/attack math. |
| `src/engine/combat` | Encounter FSM, turn loop, action economy, conditions. |
| `src/ai/ollama.ts` | Ollama HTTP client (list, chat, stream, embed). |
| `src/ai/prompts.ts` | Versioned system prompts (narrator, combat, npc, quest, lore, world, memory). |
| `src/ai/orchestrator.ts` | Builds user message, streams, validates. |
| `src/ai/validators.ts` | zod schemas for AI output. |
| `src/rag` | Embeddings + cosine rank + retrieve. |
| `src/db` | Prisma client + repositories. |
| `src/app/api` | REST + SSE endpoints. |
| `src/app/...` | Pages (App Router). |
| `src/components` | UI components (shadcn-style + domain). |
| `src/lib` | Env, utils, types, zod schemas. |
| `prisma/schema.prisma` | Database schema. |
| `tests/unit` | Vitest unit tests for every engine. |
| `docs` | Architecture, schema, API, prompts, roadmap. |
