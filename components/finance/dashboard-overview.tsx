"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Package, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardOverviewProps {
  totalIncome: number;
  totalExpenses: number;
  lastMonthIncome: number;
  lastMonthExpenses: number;
  netCashFlow: number;
  totalAssetsValue: number;
  totalInvestmentsValue: number;
  recentTransactions: Array<{
    id: string;
    title: string;
    amount: string;
    type: string;
    date: string;
  }>;
  monthlyData: Array<{ month: string; income: number; expenses: number }>;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function DashboardOverview({
  totalIncome,
  totalExpenses,
  lastMonthIncome,
  lastMonthExpenses,
  netCashFlow,
  totalAssetsValue,
  totalInvestmentsValue,
  recentTransactions,
  monthlyData,
}: DashboardOverviewProps) {
  const incomeChange = pctChange(totalIncome, lastMonthIncome);
  const expenseChange = pctChange(totalExpenses, lastMonthExpenses);

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Monthly Income"
          value={formatCurrency(totalIncome)}
          change={incomeChange}
          icon={<TrendingUp className="h-4 w-4" />}
          positive
        />
        <MetricCard
          title="Monthly Expenses"
          value={formatCurrency(totalExpenses)}
          change={expenseChange}
          icon={<TrendingDown className="h-4 w-4" />}
          positive={false}
        />
        <MetricCard
          title="Net Cash Flow"
          value={formatCurrency(netCashFlow)}
          icon={<DollarSign className="h-4 w-4" />}
          highlight={netCashFlow >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          title="Total Assets"
          value={formatCurrency(totalAssetsValue + totalInvestmentsValue)}
          subtitle={`Assets: ${formatCurrency(totalAssetsValue)}`}
          icon={<Package className="h-4 w-4" />}
        />
      </div>

      {/* Chart + Recent Transactions */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Income vs Expenses (6 months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#incomeGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        tx.type === "income" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {tx.type === "income" ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold flex-shrink-0 ${
                      tx.type === "income" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {formatCurrency(parseFloat(tx.amount))}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  subtitle,
  icon,
  positive,
  highlight,
}: {
  title: string;
  value: string;
  change?: number | null;
  subtitle?: string;
  icon: React.ReactNode;
  positive?: boolean;
  highlight?: "positive" | "negative";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold ${
            highlight === "positive" ? "text-green-600" : highlight === "negative" ? "text-red-600" : ""
          }`}
        >
          {value}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {change !== null && change !== undefined && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {change >= 0 ? (
              <ArrowUpRight className={`h-3 w-3 ${positive ? "text-green-600" : "text-red-600"}`} />
            ) : (
              <ArrowDownRight className={`h-3 w-3 ${positive ? "text-red-600" : "text-green-600"}`} />
            )}
            <span className={change >= 0 ? (positive ? "text-green-600" : "text-red-600") : positive ? "text-red-600" : "text-green-600"}>
              {Math.abs(change).toFixed(1)}%
            </span>
            &nbsp;vs last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
