import { Warehouse } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getRawMaterialAssetSummary } from "@/lib/inventory";
import { getDashboardAnalyticsSummary } from "@/lib/dashboard-analytics";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

const formatCurrency = (value: number) =>
  value.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

export default async function DashboardPage() {
  const [assetSummary, analytics] = await Promise.all([
    getRawMaterialAssetSummary(),
    getDashboardAnalyticsSummary(),
  ]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Nilai Aset Bahan Baku
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Warehouse className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(assetSummary.totalAssetValue)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {assetSummary.items.length} item terdata di inventory valuation
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Nilai Aset Bahan</CardTitle>
            <CardDescription>
              Item persediaan dengan nilai aset terbesar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.topAssetItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada data aset.
              </p>
            ) : (
              analytics.topAssetItems.map((item) => (
                <div
                  key={item.itemId}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-medium">{item.itemName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.qtyOnHand.toLocaleString("id-ID")} {item.unitCode}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(item.assetValue)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tren Biaya Bahan</CardTitle>
            <CardDescription>Perubahan harga terbaru per bahan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.materialCostTrends.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada data tren biaya.
              </p>
            ) : (
              analytics.materialCostTrends.map((item) => (
                <div
                  key={item.itemId}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-medium">{item.itemName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.latestPrice)} / {item.unitCode}
                    </p>
                  </div>
                  <Badge
                    variant={
                      item.deltaPercent !== null && item.deltaPercent > 0
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {item.deltaPercent === null
                      ? "Baru"
                      : `${item.deltaPercent >= 0 ? "+" : ""}${item.deltaPercent.toFixed(1)}%`}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Margin Produk</CardTitle>
            <CardDescription>
              Tertinggi vs terendah berdasarkan HPP
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Tertinggi
              </p>
              {analytics.highestMargins.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada data margin.
                </p>
              ) : (
                analytics.highestMargins.map((item) => (
                  <div
                    key={`h-${item.productVariantId}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-emerald-600">
                      {item.marginPercent.toFixed(1)}%
                    </p>
                  </div>
                ))
              )}
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Terendah
              </p>
              {analytics.lowestMargins.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada data margin.
                </p>
              ) : (
                analytics.lowestMargins.map((item) => (
                  <div
                    key={`l-${item.productVariantId}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <p className="font-medium">{item.productName}</p>
                    <p
                      className={cn(
                        item.marginPercent < 0
                          ? "text-destructive"
                          : "text-amber-600"
                      )}
                    >
                      {item.marginPercent.toFixed(1)}%
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
