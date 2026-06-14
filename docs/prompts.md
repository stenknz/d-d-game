# Prompts

All system prompts live in `src/ai/prompts.ts`. Each prompt is a hard-coded string, versioned by file. Settings can override per-prompt via the `promptOverrides` map in the Settings page.

## Modes

| Key | Purpose |
|---|---|
| `narrator` | Default mode. Streams the player-facing scene and any effects. |
| `combat` | Voice the round or current turn. Crisp, action-economy aware. |
| `npc` | Voice a specific NPC. In-character dialogue. |
| `quest` | Generate or update quests. Uses `addMemory` with importance 0.7+. |
| `lore` | Summarize or add lore consistent with the campaign. |
| `world` | Reflect the player's action in world state (prices, rumors, factions). |
| `memory` | Compress recent events into durable memory entries. |

## Output contract

The model must reply with a single JSON object:

```json
{
  "narration": "string the player reads",
  "effects": [
    /* see allowed effect list in src/ai/validators.ts */
  ]
}
```

The orchestrator calls Ollama with `format: "json"` so the model is constrained to JSON. Even so, the response passes through `extractJson` (handles stray fences or prose) and then `validateAiOutput` (zod). Anything that fails falls back to a narration-only turn.

## Allowed effects

- `narrate` — additional beat
- `rollDice` — ask the server to roll `1d20+5` style notation
- `applyDamage`, `applyHeal` — mutate a combatant
- `addCondition`, `removeCondition`
- `startCombat`, `endCombat`
- `addMemory` — server stores, embeds, and ranks for RAG

The model **never** mutates DB state directly. Effects are suggestions; the server validates and applies.

## Adding a new mode

1. Add the prompt in `src/ai/prompts.ts` and add the key to `PROMPT_KEYS`.
2. Add a mapping in `src/app/api/dm/chat/route.ts` (the `MODE_MAP`).
3. Optionally add a `mode:` option in the client `SessionView` and a UI control.

## Overriding prompts

Settings → "Default model" / "Temperature" / "Context length". The Settings page also stores a per-prompt override map (`promptOverrides: Record<PromptKey, string>`) — currently surfaced via API and applied in `getSystemPrompt`. The Settings UI does not yet expose the editor; that's a v1.1 addition.
