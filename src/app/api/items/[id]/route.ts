import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { ItemUpdateSchema } from "@/lib/schemas";
import { safeJsonParse } from "@/lib/utils";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({
    item: { ...item, properties: safeJsonParse(item.properties, {}) },
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = ItemUpdateSchema.safeParse({ ...(body ?? {}), id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { id: _, ...patch } = parsed.data;
  void _;
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    data[key] = key === "properties" ? JSON.stringify(value) : value;
  }
  const item = await prisma.item.update({ where: { id }, data });
  return NextResponse.json({ item: { ...item, properties: safeJsonParse(item.properties, {}) } });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await prisma.item.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
