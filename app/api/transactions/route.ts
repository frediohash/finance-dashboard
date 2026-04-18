import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { transactions, categories } from "@/db/schema/transactions";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createTransactionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().optional(),
  date: z.string(),
});

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db
    .select({
      id: transactions.id,
      title: transactions.title,
      description: transactions.description,
      amount: transactions.amount,
      type: transactions.type,
      categoryId: transactions.categoryId,
      date: transactions.date,
      createdAt: transactions.createdAt,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.userId, session.user.id))
    .orderBy(desc(transactions.date));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createTransactionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [transaction] = await db
    .insert(transactions)
    .values({
      title: parsed.data.title,
      description: parsed.data.description,
      amount: String(parsed.data.amount),
      type: parsed.data.type,
      categoryId: parsed.data.categoryId ?? null,
      date: new Date(parsed.data.date),
      userId: session.user.id,
    })
    .returning();

  return NextResponse.json(transaction, { status: 201 });
}
