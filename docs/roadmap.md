# Roadmap

This drop delivers **M0–M2**. Each milestone is gated by the Definition of Done in `AGENTS.md`: implementation, tests, code review, security review where applicable, docs.

## M0 — Foundation ✅
- Next.js 15 + TypeScript + Tailwind + shadcn-style UI
- Prisma + SQLite, schema, seed
- Dice engine (pure, unit-tested)
- Rules engine: abilities, skills, saves, attacks, modifiers
- Combat engine: encounter FSM, turn loop, conditions, action economy
- Character CRUD + sheet UI
- Campaign CRUD + dashboard
- Docker support (compose with Ollama)

## M1 — Narration MVP ✅
- Ollama client (list/chat/stream/embed)
- Prompt templates + orchestrator
- SSE streaming chat UI with effects-validated output
- Session/message persistence
- Settings page (model, temperature, context length)
- AI safety: JSON format, zod validators, fallback narration

## M2 — Rules-bound Combat ✅
- DM action endpoint: skill/ability/save/attack resolved server-side
- Death saves, short rest, long rest
- Combat API: start, turn loop, damage/heal/condition application
- Combat UI: initiative order, combatant cards, action economy buttons
- Temp HP, dead-state propagation

## M3 — World & NPCs (next)
- NPC CRUD + personality editor
- NPC journal UI
- Per-NPC memory with RAG
- World encyclopedia pages (locations, lore)
- LLM-driven NPC dialogue
- Faction reputation map

## M4 — Quests & Lore
- Quest CRUD + AI quest generator
- Lore CRUD with RAG retrieval hooked into narrator prompt
- Quest log UI
- Multi-objective tracking

## M5 — RAG memory & polish
- Short/long term memory merge, importance decay
- Persistent world reactions (prices, rumors, guard attention)
- Campaign export/import (JSON)
- Performance, error states, offline mode
- Per-prompt override editor in Settings

## M6 — Phase 2 stretch
- Image generation (Stable Diffusion / ComfyUI) for portraits and scenes
- Text maps → interactive maps (phase 2)
- Audio I/O hooks (STT/TTS stub providers)

## M7 — Multiplayer-ready architecture
- Authoritative server model already fits; expose campaign share tokens
- WebSocket / live presence (out of scope for v1)
