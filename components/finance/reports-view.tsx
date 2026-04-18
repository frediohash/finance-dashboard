"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FileBarChart } from "lucide-react";

interface Transaction {
  id: string;
  title: string;
  amount: string;
  type: string;
  categoryId: string | null;
  categoryName: string | null;
  date: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
  color: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function buildPeriodData(
  transactions: Transaction[],
  period: "monthly" | "quarterly" | "annual"
): Array<{ label: string; income: number; expenses: number; net: number }> {
  const map: Record<string, { label: string; income: number; expenses: number; net: number }> = {};

  for (const tx of transactions) {
    const d = new Date(tx.date);
    let key: string;
    let label: string;

    if (period === "monthly") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      label = d.toLocaleString("default", { month: "short", year: "2-digit" });
    } else if (period === "quarterly") {
      const q = Math.floor(d.getMonth() / 3) + 1;
      key = `${d.getFullYear()}-Q${q}`;
      label = `Q${q} ${d.getFullYear()}`;
    } else {
      key = String(d.getFullYear());
      label = key;
    }

    if (!map[key]) map[key] = { label, income: 0, expenses: 0, net: 0 };
    if (tx.type === "income") map[key].income += parseFloat(tx.amount);
    else map[key].expenses += parseFloat(tx.amount);
    map[key].net = map[key].income - map[key].expenses;
  }

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

export function ReportsView({ transactions, categories }: { transactions: Transaction[]; categories: Category[] }) {
  const [period, setPeriod] = useState<"monthly" | "quarterly" | "annual">("monthly");

  const periodData = buildPeriodData(transactions, period);

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0);

  const expenseByCategory = categories
    .filter((c) => c.type === "expense")
    .map((cat) => ({
      name: cat.name,
      value: transactions
        .filter((t) => t.type === "expense" && t.categoryId === cat.id)
        .reduce((s, t) => s + parseFloat(t.amount), 0),
      color: cat.color,
    }))
    .filter((d) => d.value > 0);

  const incomeByCategory = categories
    .filter((c) => c.type === "income")
    .map((cat) => ({
      name: cat.name,
      value: transactions
        .filter((t) => t.type === "income" && t.categoryId === cat.id)
        .reduce((s, t) => s + parseFloat(t.amount), 0),
      color: cat.color,
    }))
    .filter((d) => d.value > 0);

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-orange-500" />
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Financial performance overview</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="annual">Annual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">All-time Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">All-time Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Net Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(totalIncome - totalExpenses)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses ({period})</CardTitle>
        </CardHeader>
        <CardContent>
          {periodData.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={periodData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" className="text-xs" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseByCategory.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">No categorized expenses</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {expenseByCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {incomeByCategory.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">No categorized income</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={incomeByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {incomeByCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Net Cash Flow ({period})</CardTitle>
        </CardHeader>
        <CardContent>
          {periodData.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={periodData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" className="text-xs" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar
                  dataKey="net"
                  name="Net"
                  radius={[4, 4, 0, 0]}
                  fill="#6366f1"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
