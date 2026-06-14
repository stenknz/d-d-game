import { z } from "zod";

export const AbilityScoresSchema = z.object({
  str: z.number().int().min(1).max(30),
  dex: z.number().int().min(1).max(30),
  con: z.number().int().min(1).max(30),
  int: z.number().int().min(1).max(30),
  wis: z.number().int().min(1).max(30),
  cha: z.number().int().min(1).max(30),
});

export const SkillKeySchema = z.enum([
  "acrobatics",
  "animalHandling",
  "arcana",
  "athletics",
  "deception",
  "history",
  "insight",
  "intimidation",
  "investigation",
  "medicine",
  "nature",
  "perception",
  "performance",
  "persuasion",
  "religion",
  "sleightOfHand",
  "stealth",
  "survival",
]);

export const SpellSlotsSchema = z.record(
  z.string(),
  z.object({ max: z.number().int().min(0), used: z.number().int().min(0) }),
);

export const CharacterCreateSchema = z.object({
  campaignId: z.string().min(1),
  name: z.string().min(1).max(80),
  species: z.string().min(1),
  class: z.string().min(1),
  subclass: z.string().optional().nullable(),
  background: z.string().optional().nullable(),
  alignment: z.string().optional().nullable(),
  level: z.number().int().min(1).max(20).default(1),
  xp: z.number().int().min(0).default(0),
  abilityScores: AbilityScoresSchema,
  hp: z.number().int().min(0),
  maxHp: z.number().int().min(0),
  ac: z.number().int().min(0).default(10),
  skillProfs: z.array(SkillKeySchema).default([]),
  saveProfs: z.array(z.enum(["str", "dex", "con", "int", "wis", "cha"])).default([]),
  feats: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
});

export const CharacterUpdateSchema = CharacterCreateSchema.partial().extend({
  id: z.string().min(1),
  tempHp: z.number().int().min(0).optional(),
  hp: z.number().int().min(0).optional(),
  maxHp: z.number().int().min(0).optional(),
  conditions: z.array(z.string()).optional(),
});

export const CampaignCreateSchema = z.object({
  name: z.string().min(1).max(120),
  summary: z.string().max(2000).optional().nullable(),
  systemVersion: z.string().default("5.5e-2024"),
});

export const CampaignUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120).optional(),
  summary: z.string().max(2000).optional().nullable(),
  currentLocation: z.string().optional().nullable(),
  archived: z.boolean().optional(),
  coverImage: z.string().url().optional().nullable(),
});

export const DiceRollSchema = z.object({
  notation: z.string().min(1).max(64),
  purpose: z.string().max(120).optional(),
});

export const DMActionSchema = z.object({
  campaignId: z.string().min(1),
  characterId: z.string().optional(),
  action: z.enum([
    "skillCheck",
    "abilityCheck",
    "savingThrow",
    "attack",
    "deathSave",
    "shortRest",
    "longRest",
  ]),
  ability: z.enum(["str", "dex", "con", "int", "wis", "cha"]).optional(),
  skill: SkillKeySchema.optional(),
  dc: z.number().int().optional(),
  advantage: z.enum(["none", "advantage", "disadvantage"]).default("none"),
  // Attack-specific
  target: z
    .object({
      ac: z.number().int(),
      hp: z.number().int().optional(),
    })
    .optional(),
  damage: z
    .object({
      notation: z.string(),
      damageType: z.string().default("slashing"),
    })
    .optional(),
  weapon: z
    .object({
      useDex: z.boolean().default(false),
      proficient: z.boolean().default(true),
    })
    .optional(),
});

export const DMChatSchema = z.object({
  campaignId: z.string().min(1),
  characterId: z.string().optional(),
  text: z.string().min(1).max(4000),
  mode: z.enum(["narrator", "combat", "npc", "quest", "lore", "world", "memory"]).default("narrator"),
});

export const SettingsUpdateSchema = z.object({
  defaultModel: z.string().min(1).optional(),
  temperature: z.number().min(0).max(2).optional(),
  contextLength: z.number().int().min(512).max(200000).optional(),
  promptOverrides: z.record(z.string(), z.string()).optional(),
  theme: z.string().optional(),
});

export const CombatStartSchema = z.object({
  campaignId: z.string().min(1),
  sessionId: z.string().optional(),
  name: z.string().optional(),
  combatants: z
    .array(
      z.object({
        name: z.string().min(1),
        side: z.enum(["pc", "ally", "enemy", "neutral"]),
        initiative: z.number().int(),
        maxHp: z.number().int().min(1),
        hp: z.number().int().min(0),
        ac: z.number().int().min(0),
        initMod: z.number().int().default(0),
        speed: z.number().int().default(30),
        characterId: z.string().optional(),
        npcId: z.string().optional(),
        statblock: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .min(1),
});

export const CombatTurnActionSchema = z.object({
  encounterId: z.string().min(1),
  action: z.enum(["next", "prev", "end"]),
});

export const NPCCreateSchema = z.object({
  campaignId: z.string().min(1),
  name: z.string().min(1).max(80),
  species: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  faction: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  stats: z.record(z.string(), z.unknown()).default({
    hp: 1,
    maxHp: 1,
    ac: 10,
    init: 0,
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  }),
  personality: z
    .object({
      traits: z.array(z.string()).default([]),
      ideals: z.array(z.string()).default([]),
      bonds: z.array(z.string()).default([]),
      flaws: z.array(z.string()).default([]),
      voice: z.string().optional(),
    })
    .default({ traits: [], ideals: [], bonds: [], flaws: [] }),
  reputation: z.record(z.string(), z.number()).default({}),
  secrets: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
  portraitUrl: z.string().optional().nullable(),
});

export const NPCUpdateSchema = NPCCreateSchema.partial().extend({
  id: z.string().min(1),
  isAlive: z.boolean().optional(),
});

export const LocationCreateSchema = z.object({
  campaignId: z.string().min(1),
  name: z.string().min(1).max(120),
  kind: z.enum(["region", "city", "town", "dungeon", "building", "room"]).default("region"),
  description: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
});

export const LocationUpdateSchema = LocationCreateSchema.partial().extend({
  id: z.string().min(1),
});

export const QuestCreateSchema = z.object({
  campaignId: z.string().min(1),
  title: z.string().min(1).max(200),
  kind: z.enum(["main", "side", "faction", "personal"]).default("side"),
  description: z.string().min(1).max(4000),
  status: z.enum(["active", "completed", "failed", "abandoned"]).default("active"),
  giverId: z.string().optional().nullable(),
  rewards: z
    .object({
      xp: z.number().int().default(0),
      gold: z.number().int().default(0),
      items: z.array(z.string()).default([]),
    })
    .default({ xp: 0, gold: 0, items: [] }),
  objectives: z
    .array(
      z.object({
        description: z.string().min(1),
        order: z.number().int().default(0),
      }),
    )
    .default([]),
});

export const QuestUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  kind: z.enum(["main", "side", "faction", "personal"]).optional(),
  description: z.string().min(1).max(4000).optional(),
  status: z.enum(["active", "completed", "failed", "abandoned"]).optional(),
  giverId: z.string().optional().nullable(),
  rewards: z
    .object({
      xp: z.number().int(),
      gold: z.number().int(),
      items: z.array(z.string()),
    })
    .optional(),
});

export const LoreCreateSchema = z.object({
  campaignId: z.string().min(1),
  kind: z.enum(["kingdom", "religion", "faction", "war", "event", "legend", "npc"]).default("legend"),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  tags: z.array(z.string()).default([]),
  importance: z.number().min(0).max(1).default(0.5),
});

export const LoreUpdateSchema = LoreCreateSchema.partial().extend({
  id: z.string().min(1),
});

export const ItemCreateSchema = z.object({
  campaignId: z.string().min(1),
  name: z.string().min(1).max(120),
  kind: z.enum(["weapon", "armor", "wondrous", "consumable", "treasure"]).default("treasure"),
  rarity: z
    .enum(["common", "uncommon", "rare", "very_rare", "legendary"])
    .optional()
    .nullable(),
  attunement: z.boolean().default(false),
  properties: z.record(z.string(), z.unknown()).default({}),
  description: z.string().optional().nullable(),
});

export const ItemUpdateSchema = ItemCreateSchema.partial().extend({
  id: z.string().min(1),
});
