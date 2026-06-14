import { NextResponse } from "next/server";
import { CampaignCreateSchema } from "@/lib/schemas";
import { campaignRepo } from "@/db/repositories/campaigns";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const includeArchived = url.searchParams.get("archived") === "true";
  const campaigns = await campaignRepo.list(includeArchived);
  return NextResponse.json({ campaigns });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CampaignCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const campaign = await campaignRepo.create({
    name: parsed.data.name,
    summary: parsed.data.summary ?? null,
    systemVersion: parsed.data.systemVersion,
  });
  return NextResponse.json({ campaign }, { status: 201 });
}
