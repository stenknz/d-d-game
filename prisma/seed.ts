/**
 * Seed the database with default settings singleton and a sample campaign
 * (the latter is purely a "starter world" so the UI isn't empty on first run).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  const existing = await prisma.campaign.findFirst({
    where: { name: "The Verdant Expanse" },
  });
  if (existing) return;

  const campaign = await prisma.campaign.create({
    data: {
      name: "The Verdant Expanse",
      summary:
        "A starter campaign set in a frontier region where villages vanish one by one. Investigate, ally, survive.",
      systemVersion: "5.5e-2024",
      currentLocation: "Hollowbrook",
    },
  });

  const hollowbrook = await prisma.location.create({
    data: {
      campaignId: campaign.id,
      name: "Hollowbrook",
      kind: "town",
      description:
        "A fog-bound market town on the edge of the Glasswood. Lanterns never go out, but the people fear the treeline at night.",
      tags: JSON.stringify(["frontier", "starter", "mystery"]),
    },
  });

  await prisma.location.create({
    data: {
      campaignId: campaign.id,
      name: "The Glasswood",
      kind: "region",
      description:
        "An ancient forest of translucent trees. Maps drawn of it never match the route taken through it.",
      tags: JSON.stringify(["forest", "arcane"]),
    },
  });

  await prisma.nPC.create({
    data: {
      campaignId: campaign.id,
      locationId: hollowbrook.id,
      name: "Old Maren",
      role: "Innkeeper",
      species: "Human",
      stats: JSON.stringify({ hp: 12, maxHp: 12, ac: 10, init: 0, abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 12, cha: 14 } }),
      personality: JSON.stringify({
        traits: ["watchful", "soft-spoken"],
        ideals: ["community"],
        bonds: ["Hollowbrook"],
        flaws: ["superstitious"],
        voice: "low, measured, with a slight rasp",
      }),
      reputation: JSON.stringify({}),
      secrets: JSON.stringify([
        "She has seen a figure in a grey cloak leaving Hollowbrook at midnight.",
      ]),
    },
  });

  await prisma.quest.create({
    data: {
      campaignId: campaign.id,
      title: "The Vanishing Road",
      kind: "main",
      description:
        "A merchant left for the Glasswood and never returned. Find the trail before the next traveler goes missing.",
      rewards: JSON.stringify({ xp: 500, gold: 50, items: [] }),
      objectives: {
        create: [
          { description: "Speak with Maren at the Crooked Lantern", order: 0 },
          { description: "Find the merchant's cart on the Glasswood road", order: 1 },
          { description: "Report what you found to the village council", order: 2 },
        ],
      },
    },
  });

  await prisma.loreEntry.create({
    data: {
      campaignId: campaign.id,
      kind: "kingdom",
      title: "The Verdant League",
      body: "A loose confederation of frontier towns. No standing army; towns rely on militia and the occasional wandering hero.",
      tags: JSON.stringify(["politics", "frontier"]),
      importance: 0.7,
    },
  });

  console.log("Seed complete:", { campaignId: campaign.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
