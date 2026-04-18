"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TransactionsTable } from "./transactions-table";
import { CategoryDialog } from "./category-dialog";
import { TrendingDown } from "lucide-react";

interface Transaction {
  id: string;
  title: string;
  description: string | null;
  amount: string;
  type: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  date: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
  color: string;
  createdAt: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function ExpensesView({
  initialTransactions,
  categories: initialCategories,
}: {
  initialTransactions: Transaction[];
  categories: Category[];
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [categories, setCategories] = useState(initialCategories);

  const refresh = useCallback(async () => {
    const [txRes, catRes] = await Promise.all([fetch("/api/transactions"), fetch("/api/categories")]);
    if (txRes.ok) {
      const data = await txRes.json();
      setTransactions(data.filter((t: Transaction) => t.type === "expense"));
    }
    if (catRes.ok) setCategories(await catRes.json());
  }, []);

  const total = transactions.reduce((s, t) => s + parseFloat(t.amount), 0);

  const byCategory = categories
    .filter((c) => c.type === "expense")
    .map((cat) => ({
      name: cat.name,
      value: transactions
        .filter((t) => t.categoryId === cat.id)
        .reduce((s, t) => s + parseFloat(t.amount), 0),
      color: cat.color,
    }))
    .filter((d) => d.value > 0);

  const uncategorized = transactions.filter((t) => !t.categoryId).reduce((s, t) => s + parseFloat(t.amount), 0);
  if (uncategorized > 0) byCategory.push({ name: "Uncategorized", value: uncategorized, color: "#94a3b8" });

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-red-500" />
            Expenses
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage your expenses</p>
        </div>
        <CategoryDialog defaultType="expense" onSuccess={refresh} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{transactions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Average Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {transactions.length > 0 ? formatCurrency(total / transactions.length) : "$0"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {byCategory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>By Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {byCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        <div className={byCategory.length > 0 ? "xl:col-span-2" : "xl:col-span-3"}>
          <TransactionsTable
            initialTransactions={transactions}
            categories={categories}
            filterType="expense"
            title="Expense Transactions"
          />
        </div>
      </div>
    </div>
  );
}
