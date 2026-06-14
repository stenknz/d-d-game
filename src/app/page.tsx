import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Scroll, Sword, Brain, Map } from "lucide-react";

export default function HomePage() {
  return (
    <main className="container mx-auto max-w-5xl py-16">
      <header className="mb-12 text-center">
        <h1 className="font-display text-5xl tracking-wide text-foreground">AI Dungeon Master</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          A 5.5e (2024) game master in your terminal — or rather, in your browser.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button asChild variant="ember" size="lg">
            <Link href="/dashboard">Enter the Hall</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/settings">Settings</Link>
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Feature icon={<Sword className="h-5 w-5" />} title="Rules-bound combat">
          Initiative, attack rolls, advantage, conditions — all resolved by a rules engine
          the AI can never bypass.
        </Feature>
        <Feature icon={<Scroll className="h-5 w-5" />} title="Persistent world">
          Campaigns, characters, NPCs, locations, quests, and lore live in your local
          database. Quit anytime; resume where you left off.
        </Feature>
        <Feature icon={<Brain className="h-5 w-5" />} title="Local LLM via Ollama">
          Your story runs entirely on your machine. No cloud, no telemetry.
        </Feature>
        <Feature icon={<Map className="h-5 w-5" />} title="Future-proof">
          Modular rules engine, RAG memory, and a data-driven prompt system — built to
          accept the next rulebook.
        </Feature>
      </section>
    </main>
  );
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="rounded-md bg-accent p-2 text-accent-foreground">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{children}</CardDescription>
      </CardContent>
    </Card>
  );
}
