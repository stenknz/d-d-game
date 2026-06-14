# Database schema

SQLite (v1), Prisma ORM. All models are owned by a `Campaign`; the `User` table exists for the optional auth that arrives later.

## Entity overview

| Model | Purpose |
|---|---|
| `User` | (Future) owner of a campaign. |
| `Campaign` | Top-level world container. Has a system version, current location, archive flag. |
| `Character` | Player character. JSON columns for ability scores, proficiencies, conditions, spell slots, feats. |
| `NPC` | Non-player character with personality, reputation map, secrets. |
| `NPCMemory` | Per-NPC, per-character memory entries for fast dialogue recall. |
| `Location` | Hierarchical (region → city → town → building → room). |
| `Item` | World-wide item template. |
| `InventoryItem` | (item, owner) join. Owner is a character or campaign stash. |
| `Quest` | main/side/faction/personal. |
| `Objective` | Sub-goals belonging to a quest. |
| `LoreEntry` | kingdom/religion/faction/war/event/legend. RAG-indexed. |
| `Event` | Append-only log. Rolls, damage, travel, dialogue, system. |
| `Session` | A play session, owns messages and (optionally) encounters. |
| `Message` | player/dm/system. Discriminated by `kind`. |
| `CombatEncounter` | A live or resolved fight. Owns combatants. |
| `Combatant` | PC or NPC in an encounter. HP, AC, conditions, action economy flags. |
| `Memory` | RAG-indexed long/short-term memory. |
| `Settings` | Singleton (id="singleton") row holding model + prompt config. |

## JSON columns

The model uses JSON-as-text for fields that change shape frequently (ability scores, conditions, reputation maps, spell slot maps). Always go through `lib/utils#safeJsonParse` when reading, and `JSON.stringify` when writing.

## Embeddings

`LoreEntry.embedding` and `Memory.embedding` store `Float32` vectors packed into a `Bytes` column. RAG computes cosine similarity in-process. To swap to Chroma/FAISS later, replace `src/rag/embed.ts` only.

## Migrations

```bash
npm run db:migrate -- --name "what you changed"
```

To start fresh:

```bash
npm run db:reset
```

## Indexes

- `Campaign.ownerId`, `Campaign.archived`
- `Character.campaignId`
- `NPC.campaignId`, `NPC.locationId`
- `NPCMemory.npcId`, `NPCMemory.characterId`
- `Location.campaignId`, `Location.parentId`
- `Quest.campaignId`, `Quest.status`
- `LoreEntry.campaignId`, `LoreEntry.kind`
- `Event.campaignId`, `Event.sessionId`, `Event.type`
- `Session.campaignId`
- `Message.sessionId`
- `CombatEncounter.campaignId`, `CombatEncounter.sessionId`
- `Combatant.encounterId`
- `Memory.campaignId`, `Memory.characterId`, `Memory.scope`
