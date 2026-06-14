import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { LocationUpdateSchema } from "@/lib/schemas";
import { safeJsonParse } from "@/lib/utils";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const location = await prisma.location.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true, kind: true } },
      npcs: { select: { id: true, name: true, role: true } },
    },
  });
  if (!location) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ location: { ...location, tags: safeJsonParse(location.tags, []) } });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = LocationUpdateSchema.safeParse({ ...(body ?? {}), id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { id: _, ...patch } = parsed.data;
  void _;
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    data[key] = key === "tags" ? JSON.stringify(value) : value;
  }
  const location = await prisma.location.update({ where: { id }, data });
  return NextResponse.json({ location: { ...location, tags: safeJsonParse(location.tags, []) } });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await prisma.location.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
