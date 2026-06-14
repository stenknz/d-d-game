import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DOC_LINKS = [
  { label: "How to Play", href: "/docs#how-to-play" },
  { label: "Character Creation Guide", href: "/docs#characters" },
  { label: "Combat Basics (5.5e)", href: "/docs#combat" },
  { label: "Conditions & Status Effects", href: "/docs#conditions" },
  { label: "Resting Rules", href: "/docs#resting" },
  { label: "Experience & Leveling", href: "/docs#xp" },
  { label: "Magic & Spellcasting", href: "/docs#magic" },
  { label: "Equipment & Gear", href: "/docs#equipment" },
  { label: "Frequently Asked Questions", href: "/docs#faq" },
];

export function CampaignHelp() {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-inside list-decimal space-y-1 text-sm text-foreground/80">
            <li>Create your character or add party members.</li>
            <li>Describe what you want to do in the scene.</li>
            <li>The AI Dungeon Master will narrate the world.</li>
            <li>Use the dice roller or trust the system for rolls.</li>
            <li>Manage your party, items, quests, and world.</li>
          </ol>
          <p className="mt-3 text-sm italic text-muted-foreground">
            Have fun and enjoy your adventure!
          </p>
        </CardContent>
      </Card>

      {/* Game Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Game Documentation</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5">
            {DOC_LINKS.map((d) => (
              <li key={d.href}>
                <Link
                  href={d.href}
                  className="flex items-center justify-between rounded px-2 py-1 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-ember"
                >
                  <span>{d.label}</span>
                  <span className="text-muted-foreground">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-foreground/80">
            You are playing using <strong>D&amp;D 5.5e (2024 Rules)</strong>.
          </p>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Need more details?</p>
            <Link
              href="/docs"
              className="mt-1 inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent"
            >
              Open Rules Reference
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
