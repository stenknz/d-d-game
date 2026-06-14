# AI Dungeon Master

A local, AI-driven Dungeon Master for D&D 5.5e (2024 rules), powered by [Ollama](https://ollama.com/). The AI narrates, but never invents dice — every check, attack, save, and death save is resolved by a server-side rules engine. Your world, your model, your data, on your machine.

> All rulebook-derived content in this project is summarized in original wording. We never reproduce copyrighted rulebook text.

## Features

- **AI narration** with a streaming chat UI (SSE).
- **Local LLM support** via Ollama (Llama 3, Qwen 3, Mistral, anything Ollama runs).
- **Dice engine** supporting d4/d6/d8/d10/d12/d20/d100, advantage/disadvantage, modifiers, with deterministic seeded RNG for testing.
- **Rules engine** for ability checks, skill checks, saving throws, attacks, advantage/disadvantage, conditions, death saves, rests.
- **Combat system** with initiative, turn loop, action economy, conditions, HP tracking.
- **Persistent world** stored in SQLite via Prisma: campaigns, characters, NPCs, locations, items, quests, lore, memories, events, sessions, encounters.
- **RAG memory** with embeddings and cosine-similarity ranking. Memory promotion from short→long term by importance.
- **Strict AI effect validation** via zod — the model emits structured effects, the server applies them, anything invalid is dropped.
- **Settings** for model, temperature, context length, prompt overrides.
- **Docker support** including a compose file that brings up Next.js + Ollama side by side.

## Quickstart

### 1. Bare-metal (Node 20+)

```bash
# 1) Install Ollama separately from https://ollama.com and pull a model
ollama pull llama3.1:8b

# 2) Install dependencies
npm install

# 3) Generate Prisma client + push schema
npm run db:push

# 4) Seed an example campaign
npm run db:seed

# 5) Run
npm run dev
# open http://localhost:3000
```

### 2. Docker Compose (Next.js + Ollama together)

```bash
docker compose up --build
docker compose exec ollama ollama pull llama3.1:8b
# open http://localhost:3000
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | ESLint |
| `npm run test` | Run all unit tests |
| `npm run test:watch` | Watch mode |
| `npm run db:push` | Apply schema to SQLite |
| `npm run db:migrate` | Create + apply a migration |
| `npm run db:seed` | Seed sample campaign |
| `npm run db:reset` | Wipe DB and re-seed |

## Architecture

See `docs/architecture.md`. Summary:

- **Server (Next.js):** Prisma + SQLite, Ollama client, rules/dice/combat engines, RAG retrieval, AI orchestrator with SSE streaming.
- **Client (React):** Tailwind + shadcn-style UI, Zustand-ready, streaming chat with optimistic updates.

## Roadmap

See `docs/roadmap.md`. This drop is **M0–M2** (Foundation + Narration + Rules-bound Combat). M3+ adds NPC memory, quests, lore RAG, image gen, voice.

## Legal

The application summarizes D&D 5.5e (2024) rules in original wording. All character options, ability calculations, and mechanical descriptions are derived from publicly-discussed rules and are rephrased. No rulebook text is reproduced.
