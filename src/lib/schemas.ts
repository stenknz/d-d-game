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
