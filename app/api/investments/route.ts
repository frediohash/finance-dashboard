import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { investments } from "@/db/schema/investments";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createInvestmentSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  symbol: z.string().optional(),
  quantity: z.number().positive().optional(),
  purchasePrice: z.number().positive(),
  currentPrice: z.number().positive(),
  purchaseDate: z.string(),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db
    .select()
    .from(investments)
    .where(eq(investments.userId, session.user.id))
    .orderBy(desc(investments.createdAt));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createInvestmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [investment] = await db
    .insert(investments)
    .values({
      name: parsed.data.name,
      type: parsed.data.type,
      symbol: parsed.data.symbol,
      quantity: parsed.data.quantity !== undefined ? String(parsed.data.quantity) : null,
      purchasePrice: String(parsed.data.purchasePrice),
      currentPrice: String(parsed.data.currentPrice),
      purchaseDate: new Date(parsed.data.purchaseDate),
      notes: parsed.data.notes,
      userId: session.user.id,
    })
    .returning();

  return NextResponse.json(investment, { status: 201 });
}
