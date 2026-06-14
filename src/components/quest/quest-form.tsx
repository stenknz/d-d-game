"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const QUEST_KINDS = ["main", "side", "faction", "personal"] as const;

export function QuestForm({
  campaignId,
  npcOptions,
}: {
  campaignId: string;
  npcOptions: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<string>("side");
  const [description, setDescription] = useState("");
  const [giverId, setGiverId] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSaving(true);
    const res = await fetch("/api/quests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId,
        title: title.trim(),
        kind,
        description: description.trim(),
        giverId: giverId || null,
      }),
    });
    if (res.ok) {
      router.push(`/campaign/${campaignId}/quests`);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <Card className="max-w-lg">
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="kind">Kind</Label>
            <select
              id="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              {QUEST_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          {npcOptions.length > 0 && (
            <div className="space-y-1">
              <Label htmlFor="giver">Quest Giver</Label>
              <select
                id="giver"
                value={giverId}
                onChange={(e) => setGiverId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                <option value="">None</option>
                {npcOptions.map((npc) => (
                  <option key={npc.id} value={npc.id}>
                    {npc.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-2">
            <Button type="submit" variant="ember" disabled={saving}>
              {saving ? "Saving..." : "Create Quest"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
