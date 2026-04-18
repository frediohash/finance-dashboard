import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { transactions, categories } from "@/db/schema/transactions";
import { eq } from "drizzle-orm";
import { ReportsView } from "@/components/finance/reports-view";

export default async function ReportsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const [allTransactions, allCategories] = await Promise.all([
    db.select({
      id: transactions.id,
      title: transactions.title,
      amount: transactions.amount,
      type: transactions.type,
      categoryId: transactions.categoryId,
      date: transactions.date,
      categoryName: categories.name,
    })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.userId, userId)),
    db.select().from(categories).where(eq(categories.userId, userId)),
  ]);

  const serialized = allTransactions.map((t) => ({
    ...t,
    amount: t.amount.toString(),
    date: t.date.toISOString(),
  }));

  const serializedCategories = allCategories.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return <ReportsView transactions={serialized} categories={serializedCategories} />;
}
