import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/db/client";

const StartSessionSchema = z.object({ campaignId: z.string().min(1) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = StartSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const s = await prisma.session.create({
    data: { campaignId: parsed.data.campaignId },
  });
  await prisma.campaign.update({
    where: { id: parsed.data.campaignId },
    data: { lastPlayedAt: new Date() },
  });
  return NextResponse.json({ sessionId: s.id }, { status: 201 });
}
