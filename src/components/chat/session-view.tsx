"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MessageDTO, CharacterDTO, CombatEncounterDTO } from "@/lib/types";
import { DiceRollerInline } from "@/components/dice/dice-roller-inline";
import { CombatPanel } from "@/components/combat/combat-panel";

interface Props {
  campaignId: string;
  characters: CharacterDTO[];
  initialSessionId?: string | null;
  initialMessages: MessageDTO[];
}

export function SessionView({ campaignId, characters, initialSessionId, initialMessages }: Props) {
  const [sessionId, setSessionId] = React.useState<string | null>(initialSessionId ?? null);
  const [messages, setMessages] = React.useState<MessageDTO[]>(initialMessages);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [dmLive, setDmLive] = React.useState("");
  const [activeCharacterId, setActiveCharacterId] = React.useState<string | undefined>(characters[0]?.id);
  const [party, setParty] = React.useState<CharacterDTO[]>(characters);
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const [encounter, setEncounter] = React.useState<CombatEncounterDTO | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, dmLive]);

  async function removeCharacter(id: string, name: string) {
    if (removingId) return;
    if (!confirm(`Remove ${name} from the party? This deletes the character permanently.`)) {
      return;
    }
    setRemovingId(id);
    try {
      const r = await fetch(`/api/characters/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("delete failed");
      setParty((p) => p.filter((c) => c.id !== id));
      if (activeCharacterId === id) {
        setActiveCharacterId(party.find((c) => c.id !== id)?.id);
      }
    } catch (e) {
      alert(`Failed to remove character: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setRemovingId(null);
    }
  }

  async function send() {
    if (!input.trim() || streaming) return;
    const text = input.trim();
    setInput("");
    setStreaming(true);
    setDmLive("");

    // Optimistic player message
    const playerMsg: MessageDTO = {
      id: `tmp-${Date.now()}`,
      role: "player",
      kind: "text",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, playerMsg]);

    try {
      const r = await fetch("/api/dm/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          characterId: activeCharacterId,
          text,
          mode: "narrator",
        }),
      });
      if (!r.ok || !r.body) {
        const t = await r.text();
        throw new Error(t || "stream failed");
      }
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() ?? "";
        for (const ev of events) {
          const line = ev.replace(/^data: /, "").trim();
          if (!line || line === "[DONE]") continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === "token" && parsed.text) {
              setDmLive((cur) => cur + parsed.text);
            } else if (parsed.type === "final" && parsed.message) {
              setMessages((m) => [...m, parsed.message]);
              setDmLive("");
              if (parsed.sessionId && !sessionId) setSessionId(parsed.sessionId);
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch (e) {
      setDmLive(`(the DM is silent — ${e instanceof Error ? e.message : "stream failed"})`);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="grid min-h-[640px] grid-cols-1 gap-4 lg:grid-cols-[18rem_1fr_22rem]">
      {/* Party sidebar */}
      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Party</CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
              <Link href={`/campaign/${campaignId}/new-character`}>+ Add</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {party.length === 0 ? (
            <p className="text-sm text-muted-foreground">No characters yet.</p>
          ) : (
            party.map((c) => (
              <div
                key={c.id}
                className={`group rounded-md border p-2 transition-colors ${
                  activeCharacterId === c.id
                    ? "border-ember bg-accent"
                    : "border-border hover:bg-accent/50"
                }`}
              >
                <button
                  onClick={() => setActiveCharacterId(c.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display">{c.name}</span>
                    <Badge variant="ember">L{c.level}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.species} {c.class} · HP {c.hp}/{c.maxHp} · AC {c.ac}
                  </div>
                </button>
                <div className="mt-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCharacter(c.id, c.name);
                    }}
                    disabled={removingId === c.id}
                    title="Remove from party"
                  >
                    {removingId === c.id ? "..." : "Remove"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Chat */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Scene</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          <ScrollArea ref={scrollRef} className="flex-1 pr-2">
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "player" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg border p-3 text-sm ${
                      m.role === "player"
                        ? "border-ember/40 bg-ember/10"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                      {m.role}
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  </div>
                </div>
              ))}
              {streaming && dmLive && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg border border-border bg-card p-3 text-sm">
                    <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                      dm
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed streaming-caret">
                      {dmLive}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="mt-3">
            <Textarea
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What do you do?"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Cmd/Ctrl+Enter to send.</span>
              <div className="flex gap-2">
                <DiceRollerInline />
                <Button variant="ember" onClick={send} disabled={streaming || !input.trim()}>
                  {streaming ? "Speaking…" : "Send"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right rail: combat + dice */}
      <div className="flex flex-col gap-4">
        <CombatPanel
          campaignId={campaignId}
          sessionId={sessionId}
          characters={party}
          encounter={encounter}
          setEncounter={setEncounter}
        />
      </div>
    </div>
  );
}
