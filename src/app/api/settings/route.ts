import { prisma } from "@/db/client";
import { SettingsUpdateSchema } from "@/lib/schemas";
import { NextResponse } from "next/server";
import { safeJsonParse } from "@/lib/utils";

export async function GET() {
  const s = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  return NextResponse.json({
    settings: {
      defaultModel: s.defaultModel,
      temperature: s.temperature,
      contextLength: s.contextLength,
      promptOverrides: safeJsonParse<Record<string, string>>(s.promptOverrides, {}),
      theme: s.theme,
    },
  });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = SettingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (k === "promptOverrides" && v) data[k] = JSON.stringify(v);
    else if (v !== undefined) data[k] = v;
  }
  const s = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data, promptOverrides: (data.promptOverrides as string | undefined) ?? "{}" },
  });
  return NextResponse.json({
    settings: {
      defaultModel: s.defaultModel,
      temperature: s.temperature,
      contextLength: s.contextLength,
      promptOverrides: safeJsonParse<Record<string, string>>(s.promptOverrides, {}),
      theme: s.theme,
    },
  });
}
