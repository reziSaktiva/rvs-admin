"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductionPreview, ProductionRecipeOption } from "@/lib/production";

type PostProductionFormProps = {
  recipeOptions: ProductionRecipeOption[];
  initialRecipeId: string;
  initialBatchCount: number;
  preview: ProductionPreview | null;
};

export function PostProductionForm({
  recipeOptions,
  initialRecipeId,
  initialBatchCount,
  preview,
}: PostProductionFormProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handlePost = async () => {
    if (!preview || !preview.canPost) {
      setIsError(true);
      setMessage("Produksi belum bisa diposting. Cek ketersediaan material.");
      return;
    }

    setIsPosting(true);
    setMessage(null);
    setIsError(false);

    try {
      const response = await fetch("/api/production/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId: preview.recipe.recipeId,
          batchCount: preview.batchCount,
          note: note.trim() || undefined,
        }),
      });

      const result = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Gagal post produksi");
      }

      setIsError(false);
      setMessage("Post produksi berhasil. Stok bahan berkurang dan stok produk bertambah.");
      setNote("");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Gagal post produksi");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Form Post Produksi</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="recipeId">Resep</Label>
              <select
                id="recipeId"
                name="recipeId"
                defaultValue={initialRecipeId}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {recipeOptions.map((recipe) => (
                  <option key={recipe.recipeId} value={recipe.recipeId}>
                    {recipe.productName} - {recipe.recipeName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="batchCount">Jumlah batch</Label>
              <Input
                id="batchCount"
                name="batchCount"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={String(initialBatchCount)}
              />
            </div>

            <div className="flex items-end">
              <Button type="submit">Preview Kebutuhan</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle>Konfirmasi Posting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 text-sm">
              <div>
                <p className="text-muted-foreground">Resep</p>
                <p className="font-medium">{preview.recipe.recipeName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Batch</p>
                <p className="font-medium">{preview.batchCount.toLocaleString("id-ID")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Estimasi produk jadi (stok)</p>
                <p className="font-medium">{preview.producedQtyForStock.toLocaleString("id-ID")}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="production-note">Catatan produksi</Label>
              <Input
                id="production-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="opsional"
              />
            </div>

            <Button onClick={handlePost} disabled={isPosting || !preview.canPost}>
              {isPosting ? "Memposting..." : "Post Produksi"}
            </Button>

            {message && (
              <p className={`text-sm ${isError ? "text-destructive" : "text-emerald-600"}`}>
                {message}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
