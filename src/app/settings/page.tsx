import Link from "next/link";
import { prisma } from "@/db/client";
import { Button } from "@/components/ui/button";
import { SettingsForm } from "@/components/settings/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  return (
    <main className="container mx-auto max-w-3xl py-10">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">&larr; Back</Link>
        </Button>
      </div>
      <h1 className="mb-6 font-display text-3xl">Settings</h1>
      <SettingsForm
        defaultModel={settings.defaultModel}
        temperature={settings.temperature}
        contextLength={settings.contextLength}
        theme={settings.theme}
      />
    </main>
  );
}
