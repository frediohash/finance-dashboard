"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TransactionsTable } from "./transactions-table";
import { CategoryDialog } from "./category-dialog";
import { TrendingUp } from "lucide-react";

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

export function IncomeView({
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
      setTransactions(data.filter((t: Transaction) => t.type === "income"));
    }
    if (catRes.ok) setCategories(await catRes.json());
  }, []);

  const total = transactions.reduce((s, t) => s + parseFloat(t.amount), 0);

  const byCategory = categories
    .filter((c) => c.type === "income")
    .map((cat) => ({
      name: cat.name,
      value: transactions
        .filter((t) => t.categoryId === cat.id)
        .reduce((s, t) => s + parseFloat(t.amount), 0),
      color: cat.color,
    }))
    .filter((d) => d.value > 0);

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-green-500" />
            Income
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage your income sources</p>
        </div>
        <CategoryDialog defaultType="income" onSuccess={refresh} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(total)}</p>
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
            <CardTitle className="text-sm text-muted-foreground">Average Income</CardTitle>
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
              <CardTitle>By Source</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={byCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <YAxis type="category" dataKey="name" className="text-xs" width={80} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {byCategory.map((entry, i) => (
                      <rect key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        <div className={byCategory.length > 0 ? "xl:col-span-2" : "xl:col-span-3"}>
          <TransactionsTable
            initialTransactions={transactions}
            categories={categories}
            filterType="income"
            title="Income Transactions"
          />
        </div>
      </div>
    </div>
  );
}
