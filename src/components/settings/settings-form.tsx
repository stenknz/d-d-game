"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ModelInfo { name: string; size?: number }

export function SettingsForm(props: {
  defaultModel: string;
  temperature: number;
  contextLength: number;
  theme: string;
}) {
  const [model, setModel] = React.useState(props.defaultModel);
  const [temperature, setTemperature] = React.useState(props.temperature);
  const [contextLength, setContextLength] = React.useState(props.contextLength);
  const [models, setModels] = React.useState<ModelInfo[]>([]);
  const [status, setStatus] = React.useState<string>("checking…");
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((d) => {
        setStatus(d.ok ? "ok" : "unreachable");
        if (d.models) setModels(d.models as ModelInfo[]);
      })
      .catch(() => setStatus("unreachable"));
  }, []);

  async function save() {
    setSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaultModel: model, temperature, contextLength }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Local model (Ollama)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            Status:{" "}
            {status === "ok" ? <Badge variant="success">connected</Badge> : <Badge variant="danger">unreachable</Badge>}
          </div>
          <div>
            <Label>Default model</Label>
            <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="llama3.1:8b" />
            {models.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {models.map((m) => (
                  <Button key={m.name} size="sm" variant="outline" onClick={() => setModel(m.name)}>{m.name}</Button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Temperature ({temperature})</Label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <Label>Context length</Label>
              <Input type="number" value={contextLength} onChange={(e) => setContextLength(Number(e.target.value) || 8192)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ember" onClick={save}>Save</Button>
            {saved ? <Badge variant="success">saved</Badge> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
