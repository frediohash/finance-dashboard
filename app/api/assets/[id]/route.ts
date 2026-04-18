import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { assets } from "@/db/schema/assets";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateAssetSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["active", "inactive", "disposed", "under_maintenance"]).optional(),
  purchaseValue: z.number().positive().optional(),
  currentValue: z.number().positive().optional(),
  purchaseDate: z.string().optional(),
  depreciationRate: z.number().min(0).max(100).optional(),
  location: z.string().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = updateAssetSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.purchaseValue !== undefined) updateData.purchaseValue = String(parsed.data.purchaseValue);
  if (parsed.data.currentValue !== undefined) updateData.currentValue = String(parsed.data.currentValue);
  if (parsed.data.purchaseDate !== undefined) updateData.purchaseDate = new Date(parsed.data.purchaseDate);
  if (parsed.data.depreciationRate !== undefined) updateData.depreciationRate = String(parsed.data.depreciationRate);
  if (parsed.data.location !== undefined) updateData.location = parsed.data.location;

  const [updated] = await db
    .update(assets)
    .set(updateData)
    .where(and(eq(assets.id, id), eq(assets.userId, session.user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(assets).where(and(eq(assets.id, id), eq(assets.userId, session.user.id)));
  return NextResponse.json({ success: true });
}
