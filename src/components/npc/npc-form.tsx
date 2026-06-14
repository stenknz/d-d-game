"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function NPCForm({
  campaignId,
  initial,
}: {
  campaignId: string;
  initial?: {
    name: string;
    species?: string;
    role?: string;
    faction?: string;
    notes?: string;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [species, setSpecies] = useState(initial?.species ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [faction, setFaction] = useState(initial?.faction ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/npcs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId,
        name: name.trim(),
        species: species.trim() || null,
        role: role.trim() || null,
        faction: faction.trim() || null,
        notes: notes.trim() || null,
      }),
    });
    if (res.ok) {
      router.push(`/campaign/${campaignId}/npcs`);
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
            <Label htmlFor="species">Species</Label>
            <Input id="species" value={species} onChange={(e) => setSpecies(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="role">Role</Label>
            <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="faction">Faction</Label>
            <Input id="faction" value={faction} onChange={(e) => setFaction(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="ember" disabled={saving}>
              {saving ? "Saving..." : "Create NPC"}
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
