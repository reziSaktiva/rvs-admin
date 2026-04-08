"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CalculateHppResult, HppRecipeOption } from "@/lib/hpp";

type HppCalculatorProps = {
  recipes: HppRecipeOption[];
  initialRecipeId?: string;
};

type HppApiResponse = {
  success: boolean;
  data?: CalculateHppResult;
  message?: string;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export function HppCalculator({ recipes, initialRecipeId }: HppCalculatorProps) {
  const [recipeId, setRecipeId] = useState(initialRecipeId ?? recipes[0]?.recipeId ?? "");
  const [marginPercent, setMarginPercent] = useState("30");
  const [manualSellPrice, setManualSellPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalculateHppResult | null>(null);

  useEffect(() => {
    if (!recipeId) {
      setResult(null);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    const run = async () => {
      try {
        const response = await fetch(`/api/hpp/${recipeId}`, { cache: "no-store" });
        const payload = (await response.json()) as HppApiResponse;
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.message ?? "Gagal memuat data HPP");
        }
        if (!isCancelled) setResult(payload.data);
      } catch (fetchError) {
        if (!isCancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "Gagal memuat data HPP");
          setResult(null);
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    void run();
    return () => {
      isCancelled = true;
    };
  }, [recipeId]);

  const marginValue = Number(marginPercent);
  const targetMargin = Number.isFinite(marginValue) ? Math.max(0, marginValue) / 100 : 0;
  const hppPerUnit = result?.totals.hppPerOutputUnit ?? 0;
  const recommendedPrice = hppPerUnit * (1 + targetMargin);
  const manualPriceValue = Number(manualSellPrice);
  const actualMarginPercent =
    Number.isFinite(manualPriceValue) && manualPriceValue > 0
      ? ((manualPriceValue - hppPerUnit) / manualPriceValue) * 100
      : null;

  const selectedRecipeMeta = useMemo(
    () => recipes.find((item) => item.recipeId === recipeId) ?? null,
    [recipes, recipeId]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Simulasi HPP</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Pilih resep</label>
            <select
              value={recipeId}
              onChange={(event) => setRecipeId(event.target.value)}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {recipes.map((recipe) => (
                <option key={recipe.recipeId} value={recipe.recipeId}>
                  {recipe.productName} - {recipe.recipeName}
                </option>
              ))}
            </select>
            {selectedRecipeMeta && (
              <p className="text-xs text-muted-foreground">
                SKU: {selectedRecipeMeta.variantSku ?? "-"} · Status: {selectedRecipeMeta.status}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Target margin (%)</label>
            <Input
              type="number"
              step="0.01"
              value={marginPercent}
              onChange={(event) => setMarginPercent(event.target.value)}
              placeholder="contoh: 30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Simulasi harga jual manual</label>
            <Input
              type="number"
              step="0.01"
              value={manualSellPrice}
              onChange={(event) => setManualSellPrice(event.target.value)}
              placeholder="opsional"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Memuat breakdown HPP...
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {result && !isLoading && !error && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">HPP per Unit</CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-semibold">
                {formatCurrency(result.totals.hppPerOutputUnit)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Total Biaya Batch</CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-semibold">
                {formatCurrency(result.totals.totalBatchCost)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Output Efektif</CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-semibold">
                {result.recipe.effectiveOutputQty.toLocaleString("id-ID")} {result.recipe.outputUnit.code}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rekomendasi Harga Jual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-xl font-semibold">{formatCurrency(recommendedPrice)}</p>
                <p className="text-xs text-muted-foreground">
                  Dengan target margin {Number.isFinite(marginValue) ? marginValue : 0}%
                </p>
                {actualMarginPercent !== null && (
                  <p className="text-xs text-muted-foreground">
                    Margin aktual harga manual: {actualMarginPercent.toFixed(2)}%
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Breakdown Material</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Qty efektif</TableHead>
                    <TableHead>Harga/unit</TableHead>
                    <TableHead>Biaya</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.materials.map((item) => (
                    <TableRow key={item.recipeMaterialId}>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell>
                        {item.effectiveQty.toLocaleString("id-ID")} {item.unit.code}
                      </TableCell>
                      <TableCell>{formatCurrency(item.price.convertedPricePerUnit)}</TableCell>
                      <TableCell>{formatCurrency(item.lineCost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Biaya Tambahan</CardTitle>
              <Button variant="ghost" size="sm" disabled>
                {formatCurrency(result.totals.additionalCost)}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Komponen</TableHead>
                    <TableHead>Basis</TableHead>
                    <TableHead>Nominal</TableHead>
                    <TableHead>Diterapkan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.additionalCosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Tidak ada biaya tambahan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    result.additionalCosts.map((item) => (
                      <TableRow key={item.recipeCostId}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.basis}</TableCell>
                        <TableCell>{formatCurrency(item.amount)}</TableCell>
                        <TableCell>{formatCurrency(item.appliedAmount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
