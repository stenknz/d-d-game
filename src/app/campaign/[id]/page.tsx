import { prisma } from "@/db/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SessionView } from "@/components/chat/session-view";
import { characterRepo } from "@/db/repositories/campaigns";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.campaign.findUnique({ where: { id } });
  if (!c) notFound();
  const characters = await characterRepo.listByCampaign(id);
  const session = await prisma.session.findFirst({
    where: { campaignId: id, endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  const initialMessages = session
    ? (await prisma.message.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: "asc" },
      })).map((m) => ({
        id: m.id,
        role: m.role as "player" | "dm" | "system",
        kind: m.kind as "text" | "dice" | "image" | "summary",
        content: m.content,
        refs: m.refs ? (safeJsonParse<Record<string, unknown>>(m.refs, {})) : undefined,
        createdAt: m.createdAt.toISOString(),
      }))
    : [];

  return (
    <main className="container mx-auto max-w-7xl py-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">{c.name}</h1>
          <p className="text-sm text-muted-foreground">
            {c.currentLocation ? `📍 ${c.currentLocation}` : "No location set"} ·{" "}
            {characters.length} character{characters.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href={`/campaign/${id}/new-character`}>+ Character</Link></Button>
          <Button asChild variant="ghost"><Link href="/dashboard">Back</Link></Button>
        </div>
      </header>
      <SessionView
        campaignId={id}
        characters={characters}
        initialSessionId={session?.id}
        initialMessages={initialMessages}
      />
    </main>
  );
}
