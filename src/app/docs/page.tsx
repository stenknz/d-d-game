import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-static";

const SECTIONS: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "how-to-play",
    title: "How to Play",
    body: (
      <p>
        You play a character in a tabletop roleplaying campaign. The AI Dungeon Master narrates
        the world, voices NPCs, and adjudicates the rules. You describe what your character
        wants to do; the system resolves dice rolls and effects server-side. The model can
        never bypass the rules.
      </p>
    ),
  },
  {
    id: "characters",
    title: "Character Creation Guide",
    body: (
      <p>
        Create a character from the campaign page. Choose species, class, background, and
        alignment; pick ability scores using Standard Array, Point Buy, or manual entry. The
        rules engine calculates your proficiency bonus, skill modifiers, and saving throws
        from your sheet.
      </p>
    ),
  },
  {
    id: "combat",
    title: "Combat Basics (5.5e)",
    body: (
      <p>
        Each round, combatants act in initiative order. On your turn you have an action, a
        bonus action, a reaction, and free movement. The server tracks action economy; the AI
        never invents dice. The Combat panel walks you through starting an encounter, rolling
        initiative, and resolving attacks.
      </p>
    ),
  },
  {
    id: "conditions",
    title: "Conditions & Status Effects",
    body: (
      <p>
        Conditions like prone, grappled, frightened, restrained, poisoned, and charmed modify
        how a creature acts. The rules engine applies condition effects automatically. The
        DM may call out conditions in narration so you understand your available options.
      </p>
    ),
  },
  {
    id: "resting",
    title: "Resting Rules",
    body: (
      <p>
        A <strong>short rest</strong> (1+ hours) lets characters spend Hit Dice to recover
        hit points and use certain class features. A <strong>long rest</strong> (8 hours)
        restores all hit points, half of expended Hit Dice, and most class resources — at
        most once per 24 hours.
      </p>
    ),
  },
  {
    id: "xp",
    title: "Experience & Leveling",
    body: (
      <p>
        Characters earn XP for completing encounters, quests, and milestones. The DM awards
        XP; level thresholds double roughly every other level. At each new level you may
        gain a class feature, an Ability Score Improvement, or a feat.
      </p>
    ),
  },
  {
    id: "magic",
    title: "Magic & Spellcasting",
    body: (
      <p>
        Spell slots are tracked per character. Casting a spell expends a slot of its level or
        higher. Cantrips may be cast at will. Concentration limits you to one concentration
        spell at a time; taking damage may break concentration.
      </p>
    ),
  },
  {
    id: "equipment",
    title: "Equipment & Gear",
    body: (
      <p>
        Items are stored in the campaign&apos;s Item library and assigned to characters via
        inventory entries. Weapons, armor, wondrous items, consumables, and treasure are
        supported. Items can be attuned (one attunement slot per item, max 3 by default).
      </p>
    ),
  },
  {
    id: "faq",
    title: "Frequently Asked Questions",
    body: (
      <>
        <p>
          <strong>Can the AI change my stats?</strong> No. The rules engine is authoritative.
          The AI emits structured effects which are validated and applied by the server.
        </p>
        <p className="mt-2">
          <strong>What if the model hallucinates?</strong> Anything not in the rules is
          treated as flavor. Dice results, damage, and conditions come from the engine, not
          the model.
        </p>
        <p className="mt-2">
          <strong>Can I play offline?</strong> Yes. Ollama runs locally. The web app
          communicates only with the local Ollama endpoint.
        </p>
      </>
    ),
  },
];

export default function DocsPage() {
  return (
    <main className="container mx-auto max-w-3xl py-10">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">&larr; Back</Link>
        </Button>
      </div>
      <h1 className="mb-2 font-display text-3xl">Rules &amp; Documentation</h1>
      <p className="mb-8 text-muted-foreground">
        A quick reference for D&amp;D 5.5e (2024) as played in this app.
      </p>

      <div className="space-y-6">
        {SECTIONS.map((s) => (
          <Card key={s.id} id={s.id}>
            <CardHeader>
              <CardTitle>{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none text-sm leading-relaxed">
              {s.body}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
