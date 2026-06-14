"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatRoll, roll } from "@/engine/dice";

export function DiceRollerInline() {
  const [notation, setNotation] = React.useState("1d20+5");
  const [out, setOut] = React.useState<string | null>(null);
  const [isCrit, setCrit] = React.useState(false);

  function doRoll(n: string) {
    try {
      const r = roll(n);
      setOut(formatRoll(r));
      setCrit(r.isCrit);
    } catch (e) {
      setOut(`Error: ${e instanceof Error ? e.message : String(e)}`);
      setCrit(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={notation}
        onChange={(e) => setNotation(e.target.value)}
        className="w-28"
        placeholder="1d20+5"
      />
      <Button variant="outline" onClick={() => doRoll(notation)}>Roll</Button>
      {out ? (
        <Badge variant={isCrit ? "ember" : "secondary"} className="animate-dice">
          {out}
        </Badge>
      ) : null}
    </div>
  );
}
