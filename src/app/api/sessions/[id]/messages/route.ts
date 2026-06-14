import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/db/client";
import { safeJsonParse } from "@/lib/utils";

const PostMessageSchema = z.object({
  role: z.enum(["player", "dm", "system"]),
  kind: z.enum(["text", "dice", "image", "summary"]).default("text"),
  content: z.string().min(1).max(8000),
  refs: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = PostMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const m = await prisma.message.create({
    data: {
      sessionId: id,
      role: parsed.data.role,
      kind: parsed.data.kind,
      content: parsed.data.content,
      refs: parsed.data.refs ? JSON.stringify(parsed.data.refs) : null,
    },
  });
  return NextResponse.json({
    message: {
      id: m.id,
      role: m.role,
      kind: m.kind,
      content: m.content,
      refs: m.refs ? safeJsonParse(m.refs, null) : null,
      createdAt: m.createdAt.toISOString(),
    },
  });
}
