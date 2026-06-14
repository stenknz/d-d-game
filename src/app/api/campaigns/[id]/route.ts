import { NextResponse } from "next/server";
import { CampaignUpdateSchema } from "@/lib/schemas";
import { campaignRepo } from "@/db/repositories/campaigns";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const c = await campaignRepo.findById(id);
  if (!c) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ campaign: c });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = CampaignUpdateSchema.safeParse({ ...(body ?? {}), id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { id: _, ...patch } = parsed.data;
  void _;
  const c = await campaignRepo.update(id, patch);
  return NextResponse.json({ campaign: c });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await campaignRepo.delete(id);
  return NextResponse.json({ ok: true });
}
