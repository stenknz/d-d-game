/**
 * Domain types shared between client and server.
 * Keep these serializable: no class instances, no Date objects.
 */

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export const ABILITY_KEYS: readonly AbilityKey[] = [
  "str",
  "dex",
  "con",
  "int",
  "wis",
  "cha",
] as const;

export type SkillKey =
  | "acrobatics"
  | "animalHandling"
  | "arcana"
  | "athletics"
  | "deception"
  | "history"
  | "insight"
  | "intimidation"
  | "investigation"
  | "medicine"
  | "nature"
  | "perception"
  | "performance"
  | "persuasion"
  | "religion"
  | "sleightOfHand"
  | "stealth"
  | "survival";

export const SKILL_ABILITY: Record<SkillKey, AbilityKey> = {
  acrobatics: "dex",
  animalHandling: "wis",
  arcana: "int",
  athletics: "str",
  deception: "cha",
  history: "int",
  insight: "wis",
  intimidation: "cha",
  investigation: "int",
  medicine: "wis",
  nature: "int",
  perception: "wis",
  performance: "cha",
  persuasion: "cha",
  religion: "int",
  sleightOfHand: "dex",
  stealth: "dex",
  survival: "wis",
};

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface SpellSlots {
  [level: number]: { max: number; used: number };
}

export interface CharacterDTO {
  id: string;
  campaignId: string;
  name: string;
  species: string;
  class: string;
  subclass?: string | null;
  background?: string | null;
  alignment?: string | null;
  level: number;
  xp: number;
  profBonus: number;
  abilityScores: AbilityScores;
  hp: number;
  maxHp: number;
  tempHp: number;
  ac: number;
  initiativeMod: number;
  speed: number;
  skillProfs: SkillKey[];
  saveProfs: AbilityKey[];
  conditions: string[];
  spellSlots: SpellSlots;
  deathSuccess: number;
  deathFail: number;
  feats: string[];
  notes?: string | null;
  portraitUrl?: string | null;
  isAlive: boolean;
}

export interface CampaignDTO {
  id: string;
  name: string;
  summary: string | null;
  systemVersion: string;
  currentLocation: string | null;
  coverImage: string | null;
  archived: boolean;
  lastPlayedAt: string | null;
  createdAt: string;
}

export interface NPCDTO {
  id: string;
  campaignId: string;
  name: string;
  species: string | null;
  role: string | null;
  faction: string | null;
  locationId: string | null;
  personality: {
    traits: string[];
    ideals: string[];
    bonds: string[];
    flaws: string[];
    voice?: string;
  };
  reputation: Record<string, number>;
  secrets: string[];
  notes: string | null;
  portraitUrl: string | null;
  isAlive: boolean;
}

export interface QuestDTO {
  id: string;
  campaignId: string;
  title: string;
  kind: "main" | "side" | "faction" | "personal";
  description: string;
  status: "active" | "completed" | "failed" | "abandoned";
  giverId: string | null;
  rewards: { xp: number; gold: number; items: string[] };
  objectives: ObjectiveDTO[];
}

export interface ObjectiveDTO {
  id: string;
  description: string;
  status: "active" | "completed" | "failed";
  order: number;
}

export interface LoreEntryDTO {
  id: string;
  kind: string;
  title: string;
  body: string;
  tags: string[];
  importance: number;
}

export interface MessageDTO {
  id: string;
  role: "player" | "dm" | "system";
  kind: "text" | "dice" | "image" | "summary";
  content: string;
  refs?: Record<string, unknown>;
  createdAt: string;
}

export interface CombatantDTO {
  id: string;
  name: string;
  side: "pc" | "ally" | "enemy" | "neutral";
  initiative: number;
  initMod: number;
  hp: number;
  maxHp: number;
  tempHp: number;
  ac: number;
  conditions: string[];
  actionUsed: boolean;
  bonusUsed: boolean;
  reactionUsed: boolean;
  movementUsed: number;
  speed: number;
  isDead: boolean;
  characterId?: string | null;
  npcId?: string | null;
}

export interface CombatEncounterDTO {
  id: string;
  campaignId: string;
  name: string | null;
  status: "idle" | "rolling" | "active" | "ended";
  round: number;
  turnIndex: number;
  combatants: CombatantDTO[];
}

export type AIEffect =
  | { type: "applyDamage"; targetId: string; amount: number; source?: string }
  | { type: "applyHeal"; targetId: string; amount: number }
  | { type: "addCondition"; targetId: string; condition: string; duration?: number }
  | { type: "removeCondition"; targetId: string; condition: string }
  | { type: "startCombat"; name?: string }
  | { type: "endCombat" }
  | { type: "rollDice"; notation: string; purpose?: string }
  | { type: "addMemory"; content: string; importance?: number; refs?: Record<string, unknown> }
  | { type: "narrate"; text: string };

export interface AITurnOutput {
  narration: string;
  effects: AIEffect[];
}
