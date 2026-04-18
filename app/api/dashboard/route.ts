import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { transactions } from "@/db/schema/transactions";
import { assets } from "@/db/schema/assets";
import { investments } from "@/db/schema/investments";
import { eq, and, gte, sql } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [allTransactions, allAssets, allInvestments] = await Promise.all([
    db.select().from(transactions).where(eq(transactions.userId, userId)),
    db.select().from(assets).where(eq(assets.userId, userId)),
    db.select().from(investments).where(eq(investments.userId, userId)),
  ]);

  const thisMonthTx = allTransactions.filter((t) => new Date(t.date) >= startOfMonth);
  const lastMonthTx = allTransactions.filter(
    (t) => new Date(t.date) >= startOfLastMonth && new Date(t.date) <= endOfLastMonth
  );

  const totalIncome = thisMonthTx
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalExpenses = thisMonthTx
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const lastMonthIncome = lastMonthTx
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const lastMonthExpenses = lastMonthTx
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalAssetsValue = allAssets.reduce((sum, a) => sum + parseFloat(a.currentValue), 0);

  const totalInvestmentsValue = allInvestments.reduce(
    (sum, i) => sum + parseFloat(i.currentPrice) * parseFloat(i.quantity ?? "1"),
    0
  );

  const totalInvestmentsCost = allInvestments.reduce(
    (sum, i) => sum + parseFloat(i.purchasePrice) * parseFloat(i.quantity ?? "1"),
    0
  );

  const investmentROI =
    totalInvestmentsCost > 0
      ? ((totalInvestmentsValue - totalInvestmentsCost) / totalInvestmentsCost) * 100
      : 0;

  const recentTransactions = allTransactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const monthlyData = buildMonthlyData(allTransactions);

  return NextResponse.json({
    totalIncome,
    totalExpenses,
    netCashFlow: totalIncome - totalExpenses,
    lastMonthIncome,
    lastMonthExpenses,
    totalAssetsValue,
    totalInvestmentsValue,
    investmentROI,
    recentTransactions,
    monthlyData,
  });
}

function buildMonthlyData(allTransactions: typeof transactions.$inferSelect[]) {
  const months: Record<string, { month: string; income: number; expenses: number }> = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months[key] = {
      month: d.toLocaleString("default", { month: "short" }),
      income: 0,
      expenses: 0,
    };
  }

  for (const tx of allTransactions) {
    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (months[key]) {
      if (tx.type === "income") months[key].income += parseFloat(tx.amount);
      else months[key].expenses += parseFloat(tx.amount);
    }
  }

  return Object.values(months);
}
