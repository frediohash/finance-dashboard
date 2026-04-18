import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { transactions, categories } from "@/db/schema/transactions";
import { eq } from "drizzle-orm";
import { ExpensesView } from "@/components/finance/expenses-view";

export default async function ExpensesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const [allTransactions, allCategories] = await Promise.all([
    db.select({
      id: transactions.id,
      title: transactions.title,
      description: transactions.description,
      amount: transactions.amount,
      type: transactions.type,
      categoryId: transactions.categoryId,
      date: transactions.date,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.userId, userId)),
    db.select().from(categories).where(eq(categories.userId, userId)),
  ]);

  const expenseTransactions = allTransactions
    .filter((t) => t.type === "expense")
    .map((t) => ({ ...t, amount: t.amount.toString(), date: t.date.toISOString() }));

  const serializedCategories = allCategories.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return <ExpensesView initialTransactions={expenseTransactions} categories={serializedCategories} />;
}
