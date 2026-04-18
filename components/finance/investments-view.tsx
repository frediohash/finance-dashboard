"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InvestmentDialog } from "./investment-dialog";
import { toast } from "sonner";
import { BarChart3, Trash2, Search, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Investment {
  id: string;
  name: string;
  type: string;
  symbol: string | null;
  quantity: string | null;
  purchasePrice: string;
  currentPrice: string;
  purchaseDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}

export function InvestmentsView({ initialInvestments }: { initialInvestments: Investment[] }) {
  const [investments, setInvestments] = useState(initialInvestments);
  const [search, setSearch] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/investments");
    if (res.ok) setInvestments(await res.json());
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this investment?")) return;
    const res = await fetch(`/api/investments/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Investment deleted");
      setInvestments((prev) => prev.filter((i) => i.id !== id));
    } else {
      toast.error("Failed to delete");
    }
  }

  const displayed = investments.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.type.toLowerCase().includes(search.toLowerCase()) ||
      (i.symbol?.toLowerCase() ?? "").includes(search.toLowerCase())
  );

  const totalCurrentValue = investments.reduce(
    (s, i) => s + parseFloat(i.currentPrice) * parseFloat(i.quantity ?? "1"),
    0
  );
  const totalCost = investments.reduce(
    (s, i) => s + parseFloat(i.purchasePrice) * parseFloat(i.quantity ?? "1"),
    0
  );
  const totalGain = totalCurrentValue - totalCost;
  const roi = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  const byType = Object.values(
    investments.reduce(
      (acc, i) => {
        const val = parseFloat(i.currentPrice) * parseFloat(i.quantity ?? "1");
        if (!acc[i.type]) acc[i.type] = { type: i.type, value: 0 };
        acc[i.type].value += val;
        return acc;
      },
      {} as Record<string, { type: string; value: number }>
    )
  );

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-purple-500" />
            Investments
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track your investment portfolio</p>
        </div>
        <InvestmentDialog onSuccess={refresh} />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalCurrentValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Gain/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold flex items-center gap-1 ${totalGain >= 0 ? "text-green-600" : "text-red-600"}`}>
              {totalGain >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {formatCurrency(Math.abs(totalGain))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${roi >= 0 ? "text-green-600" : "text-red-600"}`}>
              {roi >= 0 ? "+" : ""}
              {roi.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {byType.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>By Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={byType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" className="text-xs" />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card className={byType.length > 0 ? "xl:col-span-2" : "xl:col-span-3"}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle>Portfolio</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search investments..."
                  className="pl-8 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {displayed.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">
                {investments.length === 0
                  ? "No investments yet. Add your first investment."
                  : "No investments match your search."}
              </p>
            ) : (
              <div className="space-y-3">
                {displayed.map((inv) => {
                  const qty = parseFloat(inv.quantity ?? "1");
                  const cost = parseFloat(inv.purchasePrice) * qty;
                  const current = parseFloat(inv.currentPrice) * qty;
                  const gain = current - cost;
                  const gainPct = cost > 0 ? (gain / cost) * 100 : 0;

                  return (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{inv.name}</p>
                          {inv.symbol && (
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{inv.symbol}</span>
                          )}
                          <span className="text-xs text-muted-foreground">{inv.type}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          {inv.quantity && <span>Qty: {inv.quantity}</span>}
                          <span>Cost: {formatCurrency(cost)}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold">{formatCurrency(current)}</p>
                        <p className={`text-sm ${gain >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {gain >= 0 ? "+" : ""}
                          {formatCurrency(gain)} ({gainPct.toFixed(1)}%)
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <InvestmentDialog investment={inv} onSuccess={refresh} />
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(inv.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
