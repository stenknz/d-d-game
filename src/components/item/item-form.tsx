"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const ITEM_KINDS = ["weapon", "armor", "wondrous", "consumable", "treasure"] as const;
const RARITIES = ["common", "uncommon", "rare", "very_rare", "legendary"] as const;

export function ItemForm({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<string>("treasure");
  const [rarity, setRarity] = useState<string>("");
  const [description, setDescription] = useState("");
  const [attunement, setAttunement] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId,
        name: name.trim(),
        kind,
        rarity: rarity || null,
        attunement,
        description: description.trim() || null,
      }),
    });
    if (res.ok) {
      router.push(`/campaign/${campaignId}/items`);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <Card className="max-w-lg">
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="kind">Kind</Label>
            <select
              id="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              {ITEM_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="rarity">Rarity</Label>
            <select
              id="rarity"
              value={rarity}
              onChange={(e) => setRarity(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">None</option>
              {RARITIES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="attunement"
              type="checkbox"
              checked={attunement}
              onChange={(e) => setAttunement(e.target.checked)}
              className="h-4 w-4 rounded border-border bg-background"
            />
            <Label htmlFor="attunement">Requires Attunement</Label>
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="ember" disabled={saving}>
              {saving ? "Saving..." : "Create Item"}
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
