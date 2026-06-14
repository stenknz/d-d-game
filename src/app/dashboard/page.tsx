import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { prisma } from "@/db/client";
import { CreateCampaignButton } from "@/components/campaign/create-campaign-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const rows = await prisma.campaign.findMany({
    where: { archived: false },
    orderBy: { lastPlayedAt: { sort: "desc", nulls: "last" } },
  });
  return (
    <main className="container mx-auto max-w-6xl py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Campaign Hall</h1>
          <p className="text-muted-foreground">Your adventures, saved and waiting.</p>
        </div>
        <CreateCampaignButton />
      </header>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No campaigns yet. Forge your first.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => (
            <Card key={c.id} className="hover:border-ember/60 transition-colors">
              <CardHeader>
                <CardTitle>{c.name}</CardTitle>
                <CardDescription>
                  {c.summary ?? "No summary yet."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  <div>System: {c.systemVersion}</div>
                  <div>Last played: {c.lastPlayedAt?.toLocaleString() ?? "never"}</div>
                </div>
                <Button asChild variant="ember" size="sm">
                  <Link href={`/campaign/${c.id}`}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
