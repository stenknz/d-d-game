"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export function CreateCampaignButton() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const router = useRouter();

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, summary }),
      });
      if (!r.ok) throw new Error((await r.json()).error?.toString?.() ?? "failed");
      const { campaign } = await r.json();
      router.push(`/campaign/${campaign.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button variant="ember" onClick={() => setOpen(true)}>
        + New Campaign
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl">
        <h2 className="mb-4 font-display text-2xl">New Campaign</h2>
        <div className="space-y-3">
          <div>
            <Label htmlFor="cc-name">Name</Label>
            <Input id="cc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="The Verdant Expanse" />
          </div>
          <div>
            <Label htmlFor="cc-summary">Summary (optional)</Label>
            <Textarea id="cc-summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} />
          </div>
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="ember" onClick={submit} disabled={busy || !name.trim()}>
            {busy ? "Creating…" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
