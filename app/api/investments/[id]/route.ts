import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { investments } from "@/db/schema/investments";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateInvestmentSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().optional(),
  symbol: z.string().optional(),
  quantity: z.number().positive().optional(),
  purchasePrice: z.number().positive().optional(),
  currentPrice: z.number().positive().optional(),
  purchaseDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = updateInvestmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
  if (parsed.data.symbol !== undefined) updateData.symbol = parsed.data.symbol;
  if (parsed.data.quantity !== undefined) updateData.quantity = String(parsed.data.quantity);
  if (parsed.data.purchasePrice !== undefined) updateData.purchasePrice = String(parsed.data.purchasePrice);
  if (parsed.data.currentPrice !== undefined) updateData.currentPrice = String(parsed.data.currentPrice);
  if (parsed.data.purchaseDate !== undefined) updateData.purchaseDate = new Date(parsed.data.purchaseDate);
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

  const [updated] = await db
    .update(investments)
    .set(updateData)
    .where(and(eq(investments.id, id), eq(investments.userId, session.user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(investments).where(and(eq(investments.id, id), eq(investments.userId, session.user.id)));
  return NextResponse.json({ success: true });
}
