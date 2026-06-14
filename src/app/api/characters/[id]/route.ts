import { NextResponse } from "next/server";
import { CharacterUpdateSchema } from "@/lib/schemas";
import { characterRepo } from "@/db/repositories/campaigns";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const c = await characterRepo.findById(id);
  if (!c) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ character: c });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = CharacterUpdateSchema.safeParse({ ...(body ?? {}), id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { id: _ignore, ...patch } = parsed.data;
  const c = await characterRepo.update(id, patch);
  return NextResponse.json({ character: c });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await characterRepo.delete(id);
  return NextResponse.json({ ok: true });
}
