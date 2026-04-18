"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AssetDialog } from "./asset-dialog";
import { toast } from "sonner";
import { Package, Trash2, Search, MapPin } from "lucide-react";

interface Asset {
  id: string;
  name: string;
  description: string | null;
  category: string;
  status: string;
  purchaseValue: string;
  currentValue: string;
  purchaseDate: string;
  depreciationRate: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-700",
  disposed: "bg-red-100 text-red-700",
  under_maintenance: "bg-yellow-100 text-yellow-700",
};

export function AssetsView({ initialAssets }: { initialAssets: Asset[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [search, setSearch] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/assets");
    if (res.ok) setAssets(await res.json());
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this asset?")) return;
    const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Asset deleted");
      setAssets((prev) => prev.filter((a) => a.id !== id));
    } else {
      toast.error("Failed to delete");
    }
  }

  const displayed = assets.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalCurrentValue = assets.reduce((s, a) => s + parseFloat(a.currentValue), 0);
  const totalPurchaseValue = assets.reduce((s, a) => s + parseFloat(a.purchaseValue), 0);
  const totalDepreciation = totalPurchaseValue - totalCurrentValue;
  const activeCount = assets.filter((a) => a.status === "active").length;

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-500" />
            Assets
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage company assets and their values</p>
        </div>
        <AssetDialog onSuccess={refresh} />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalCurrentValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Purchase Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalPurchaseValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Depreciation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">{formatCurrency(totalDepreciation)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle>Asset Catalog</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
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
              {assets.length === 0 ? "No assets yet. Add your first asset." : "No assets match your search."}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {displayed.map((asset) => {
                const depreciation =
                  parseFloat(asset.purchaseValue) > 0
                    ? ((parseFloat(asset.purchaseValue) - parseFloat(asset.currentValue)) /
                        parseFloat(asset.purchaseValue)) *
                      100
                    : 0;
                return (
                  <div key={asset.id} className="border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{asset.category}</p>
                      </div>
                      <div className="flex gap-1">
                        <AssetDialog asset={asset} onSuccess={refresh} />
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(asset.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current Value</span>
                        <span className="font-semibold">{formatCurrency(parseFloat(asset.currentValue))}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Purchase Value</span>
                        <span>{formatCurrency(parseFloat(asset.purchaseValue))}</span>
                      </div>
                      {depreciation > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Depreciation</span>
                          <span className="text-red-500">{depreciation.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          STATUS_STYLES[asset.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {asset.status.replace("_", " ")}
                      </span>
                      {asset.location && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {asset.location}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
