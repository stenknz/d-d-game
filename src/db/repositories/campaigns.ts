import { prisma } from "@/db/client";
import { safeJsonParse } from "@/lib/utils";
import type {
  AbilityKey,
  AbilityScores,
  CampaignDTO,
  CharacterDTO,
  SkillKey,
  SpellSlots,
} from "@/lib/types";

function toCharacterDTO(row: {
  id: string;
  campaignId: string;
  name: string;
  species: string;
  class: string;
  subclass: string | null;
  background: string | null;
  alignment: string | null;
  level: number;
  xp: number;
  profBonus: number;
  abilityScores: string;
  hp: number;
  maxHp: number;
  tempHp: number;
  ac: number;
  initiativeMod: number;
  speed: number;
  skillProfs: string;
  saveProfs: string;
  conditions: string;
  spellSlots: string;
  deathSuccess: number;
  deathFail: number;
  feats: string;
  notes: string | null;
  portraitUrl: string | null;
  isAlive: boolean;
}): CharacterDTO {
  return {
    id: row.id,
    campaignId: row.campaignId,
    name: row.name,
    species: row.species,
    class: row.class,
    subclass: row.subclass,
    background: row.background,
    alignment: row.alignment,
    level: row.level,
    xp: row.xp,
    profBonus: row.profBonus,
    abilityScores: safeJsonParse<AbilityScores>(row.abilityScores, {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    }),
    hp: row.hp,
    maxHp: row.maxHp,
    tempHp: row.tempHp,
    ac: row.ac,
    initiativeMod: row.initiativeMod,
    speed: row.speed,
    skillProfs: safeJsonParse<SkillKey[]>(row.skillProfs, []),
    saveProfs: safeJsonParse<AbilityKey[]>(row.saveProfs, []),
    conditions: safeJsonParse<string[]>(row.conditions, []),
    spellSlots: safeJsonParse<SpellSlots>(row.spellSlots, {}),
    deathSuccess: row.deathSuccess,
    deathFail: row.deathFail,
    feats: safeJsonParse<string[]>(row.feats, []),
    notes: row.notes,
    portraitUrl: row.portraitUrl,
    isAlive: row.isAlive,
  };
}

export const characterRepo = {
  async listByCampaign(campaignId: string): Promise<CharacterDTO[]> {
    const rows = await prisma.character.findMany({
      where: { campaignId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toCharacterDTO);
  },
  async findById(id: string): Promise<CharacterDTO | null> {
    const row = await prisma.character.findUnique({ where: { id } });
    return row ? toCharacterDTO(row) : null;
  },
  async create(input: {
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
    ac: number;
    initiativeMod: number;
    speed: number;
    skillProfs: SkillKey[];
    saveProfs: AbilityKey[];
    feats: string[];
    notes?: string | null;
  }): Promise<CharacterDTO> {
    const row = await prisma.character.create({
      data: {
        campaignId: input.campaignId,
        name: input.name,
        species: input.species,
        class: input.class,
        subclass: input.subclass ?? null,
        background: input.background ?? null,
        alignment: input.alignment ?? null,
        level: input.level,
        xp: input.xp,
        profBonus: input.profBonus,
        abilityScores: JSON.stringify(input.abilityScores),
        hp: input.hp,
        maxHp: input.maxHp,
        ac: input.ac,
        initiativeMod: input.initiativeMod,
        speed: input.speed,
        skillProfs: JSON.stringify(input.skillProfs),
        saveProfs: JSON.stringify(input.saveProfs),
        conditions: JSON.stringify([]),
        spellSlots: JSON.stringify({}),
        feats: JSON.stringify(input.feats),
        notes: input.notes ?? null,
      },
    });
    return toCharacterDTO(row);
  },
  async update(id: string, patch: Partial<{
    name: string;
    species: string;
    class: string;
    subclass: string | null;
    background: string | null;
    alignment: string | null;
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
    notes: string | null;
    portraitUrl: string | null;
    isAlive: boolean;
  }>): Promise<CharacterDTO> {
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) continue;
      if (k === "abilityScores") data.abilityScores = JSON.stringify(v);
      else if (k === "skillProfs" || k === "saveProfs" || k === "conditions" || k === "feats")
        data[k] = JSON.stringify(v);
      else if (k === "spellSlots") data.spellSlots = JSON.stringify(v);
      else data[k] = v;
    }
    const row = await prisma.character.update({ where: { id }, data });
    return toCharacterDTO(row);
  },
  async delete(id: string): Promise<void> {
    await prisma.character.delete({ where: { id } });
  },
};

export function toCampaignDTO(row: {
  id: string;
  name: string;
  summary: string | null;
  systemVersion: string;
  currentLocation: string | null;
  coverImage: string | null;
  archived: boolean;
  lastPlayedAt: Date | null;
  createdAt: Date;
}): CampaignDTO {
  return {
    id: row.id,
    name: row.name,
    summary: row.summary,
    systemVersion: row.systemVersion,
    currentLocation: row.currentLocation,
    coverImage: row.coverImage,
    archived: row.archived,
    lastPlayedAt: row.lastPlayedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export const campaignRepo = {
  async list(includeArchived = false): Promise<CampaignDTO[]> {
    const rows = await prisma.campaign.findMany({
      where: includeArchived ? {} : { archived: false },
      orderBy: { lastPlayedAt: { sort: "desc", nulls: "last" } },
    });
    return rows.map(toCampaignDTO);
  },
  async findById(id: string): Promise<CampaignDTO | null> {
    const row = await prisma.campaign.findUnique({ where: { id } });
    return row ? toCampaignDTO(row) : null;
  },
  async create(input: { name: string; summary?: string | null; systemVersion: string }): Promise<CampaignDTO> {
    const row = await prisma.campaign.create({
      data: {
        name: input.name,
        summary: input.summary ?? null,
        systemVersion: input.systemVersion,
      },
    });
    return toCampaignDTO(row);
  },
  async update(id: string, patch: Partial<{
    name: string;
    summary: string | null;
    currentLocation: string | null;
    archived: boolean;
    coverImage: string | null;
  }>): Promise<CampaignDTO> {
    const row = await prisma.campaign.update({ where: { id }, data: patch });
    return toCampaignDTO(row);
  },
  async touch(id: string): Promise<void> {
    await prisma.campaign.update({
      where: { id },
      data: { lastPlayedAt: new Date() },
    });
  },
  async delete(id: string): Promise<void> {
    await prisma.campaign.delete({ where: { id } });
  },
};
