"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransactionDialog } from "./transaction-dialog";
import { toast } from "sonner";
import { Trash2, ArrowUpRight, ArrowDownRight, Search } from "lucide-react";

interface Transaction {
  id: string;
  title: string;
  description: string | null;
  amount: string;
  type: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  date: string | Date;
}

interface Category {
  id: string;
  name: string;
  type: string;
  color: string;
}

interface Props {
  initialTransactions: Transaction[];
  categories: Category[];
  filterType?: "income" | "expense";
  title: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function TransactionsTable({ initialTransactions, categories, filterType, title }: Props) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/transactions");
    if (res.ok) {
      const data = await res.json();
      setTransactions(filterType ? data.filter((t: Transaction) => t.type === filterType) : data);
    }
  }, [filterType]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction?")) return;
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Transaction deleted");
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } else {
      toast.error("Failed to delete");
    }
  }

  const displayTransactions = transactions
    .filter((t) => {
      const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "all" || t.categoryId === categoryFilter;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const total = displayTransactions.reduce((s, t) => s + parseFloat(t.amount), 0);
  const filteredCategories = filterType ? categories.filter((c) => c.type === filterType) : categories;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <TransactionDialog
            defaultType={filterType ?? "expense"}
            categories={categories}
            onSuccess={refresh}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {filteredCategories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {filteredCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displayTransactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">No transactions found</p>
        ) : (
          <div className="space-y-2">
            {displayTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${
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
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString()}
                      </span>
                      {tx.categoryName && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {tx.categoryName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-sm font-semibold ${
                      tx.type === "income" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {formatCurrency(parseFloat(tx.amount))}
                  </span>
                  <TransactionDialog
                    categories={categories}
                    transaction={{ ...tx, date: new Date(tx.date).toISOString(), description: tx.description }}
                    onSuccess={refresh}
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(tx.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t text-sm font-semibold">
              <span>Total ({displayTransactions.length} transactions)</span>
              <span className={filterType === "income" ? "text-green-600" : filterType === "expense" ? "text-red-600" : ""}>
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
