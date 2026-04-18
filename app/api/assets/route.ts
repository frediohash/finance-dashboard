import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { assets } from "@/db/schema/assets";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createAssetSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  status: z.enum(["active", "inactive", "disposed", "under_maintenance"]).optional(),
  purchaseValue: z.number().positive(),
  currentValue: z.number().positive(),
  purchaseDate: z.string(),
  depreciationRate: z.number().min(0).max(100).optional(),
  location: z.string().optional(),
});

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db
    .select()
    .from(assets)
    .where(eq(assets.userId, session.user.id))
    .orderBy(desc(assets.createdAt));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createAssetSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [asset] = await db
    .insert(assets)
    .values({
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      status: parsed.data.status ?? "active",
      purchaseValue: String(parsed.data.purchaseValue),
      currentValue: String(parsed.data.currentValue),
      purchaseDate: new Date(parsed.data.purchaseDate),
      depreciationRate: parsed.data.depreciationRate !== undefined ? String(parsed.data.depreciationRate) : null,
      location: parsed.data.location,
      userId: session.user.id,
    })
    .returning();

  return NextResponse.json(asset, { status: 201 });
}
