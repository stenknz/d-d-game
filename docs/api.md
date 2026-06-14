# API reference

All endpoints are JSON unless noted. SSE endpoints use `text/event-stream`.

## Campaigns

- `GET  /api/campaigns?archived=true|false` — list
- `POST /api/campaigns` — create `{ name, summary?, systemVersion? }`
- `GET  /api/campaigns/:id`
- `PATCH /api/campaigns/:id` — partial update
- `DELETE /api/campaigns/:id`

## Characters

- `GET  /api/characters?campaignId=...` — list
- `POST /api/characters` — create
- `GET  /api/characters/:id`
- `PATCH /api/characters/:id`
- `DELETE /api/characters/:id`

## Dice

- `POST /api/dice` — `{ notation, purpose? }` → `{ rolls, kept, dropped, modifier, total, isCrit, isFumble, formatted }`

## Sessions

- `POST /api/sessions` — `{ campaignId }` → start a session (or reuse the open one)
- `GET  /api/sessions/:id` — fetch with messages
- `POST /api/sessions/:id/messages` — `{ role, kind?, content, refs? }`

## DM

- `POST /api/dm/chat` (SSE) — `{ campaignId, characterId?, text, mode? }` streams:
  - `data: {"type":"token","text":"…"}` per chunk
  - `data: {"type":"final","message":{...},"effects":[...],"model":"..."}`
  - `data: [DONE]`
- `POST /api/dm/action` — rule-bound, never AI. `{ campaignId, characterId, action, … }` where `action` is one of:
  - `skillCheck` (`skill`, `dc?`, `advantage?`)
  - `abilityCheck` (`ability`, `dc?`, `advantage?`)
  - `savingThrow` (`ability`, `dc?`, `advantage?`)
  - `attack` (`target.ac`, `damage.notation`, `damage.damageType?`)
  - `deathSave`
  - `shortRest`, `longRest`

## Combat

- `POST /api/combat` — start an encounter `{ campaignId, sessionId?, name?, combatants[] }`
- `GET  /api/combat?encounterId=...` — fetch
- `POST /api/combat/turn` — `{ encounterId, action: "next" | "prev" | "end" }`
- `POST /api/combat/action` — `{ combatantId, action: "damage" | "heal" | "addCondition" | "removeCondition", amount? | condition? }`

## Models

- `GET /api/models` — `{ ok, models[] }` from Ollama

## Settings

- `GET  /api/settings`
- `PATCH /api/settings` — partial update `{ defaultModel?, temperature?, contextLength?, promptOverrides?, theme? }`

## Error format

```json
{ "error": "string or zod-flattened tree" }
```

Status codes: 400 (validation), 404 (not found), 503 (Ollama unreachable).
