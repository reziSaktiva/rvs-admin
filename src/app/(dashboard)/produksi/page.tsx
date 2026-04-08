import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  getProductionRecipeOptions,
  getProductionRunHistory,
  previewProductionPost,
} from "@/lib/production";
import { PostProductionForm } from "@/components/production/post-production-form";

type ProduksiPageProps = {
  searchParams?: Promise<{
    recipeId?: string;
    batchCount?: string;
  }>;
};

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID");
};

const formatCurrency = (value: number) =>
  value.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export default async function ProduksiPage({ searchParams }: ProduksiPageProps) {
  const params = (await searchParams) ?? {};
  const recipeOptions = await getProductionRecipeOptions();

  if (recipeOptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Post Produksi</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Belum ada data resep. Tambahkan resep produksi terlebih dahulu.
        </CardContent>
      </Card>
    );
  }

  const recipeId = params.recipeId ?? recipeOptions[0].recipeId;
  const batchCountParam = Number(params.batchCount ?? "1");
  const batchCount = Number.isFinite(batchCountParam) && batchCountParam > 0 ? batchCountParam : 1;

  let preview = null;
  let previewError: string | null = null;
  try {
    preview = await previewProductionPost(recipeId, batchCount);
  } catch (error) {
    previewError = error instanceof Error ? error.message : "Gagal preview post produksi";
  }

  const runHistory = await getProductionRunHistory(30);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Post Produksi</h1>
        <p className="text-sm text-muted-foreground">
          Konversi material ke produk jadi: bahan berkurang, stok produk bertambah.
        </p>
      </div>

      <PostProductionForm
        recipeOptions={recipeOptions}
        initialRecipeId={recipeId}
        initialBatchCount={batchCount}
        preview={preview}
      />

      <Card>
        <CardHeader>
          <CardTitle>Preview Kebutuhan Material</CardTitle>
        </CardHeader>
        <CardContent>
          {previewError ? (
            <p className="text-sm text-destructive">{previewError}</p>
          ) : !preview ? (
            <p className="text-sm text-muted-foreground">Belum ada data preview.</p>
          ) : (
            <>
              <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Produk</p>
                  <p className="font-medium">{preview.recipe.productName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Output raw</p>
                  <p className="font-medium">
                    {preview.producedQtyRaw.toLocaleString("id-ID")} {preview.recipe.outputUnitCode}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Output efektif</p>
                  <p className="font-medium">
                    {preview.producedQtyEffective.toLocaleString("id-ID")} {preview.recipe.outputUnitCode}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status kesiapan</p>
                  <Badge variant={preview.canPost ? "default" : "destructive"}>
                    {preview.canPost ? "Siap diposting" : "Material tidak cukup"}
                  </Badge>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Kebutuhan</TableHead>
                    <TableHead>Stok tersedia</TableHead>
                    <TableHead>Selisih</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.materials.map((material) => (
                    <TableRow key={material.recipeMaterialId}>
                      <TableCell>{material.itemName}</TableCell>
                      <TableCell>
                        {material.requiredQty.toLocaleString("id-ID")} {material.unitCode}
                      </TableCell>
                      <TableCell>
                        {material.availableQty.toLocaleString("id-ID")} {material.unitCode}
                      </TableCell>
                      <TableCell>
                        {material.shortfallQty.toLocaleString("id-ID")} {material.unitCode}
                      </TableCell>
                      <TableCell>
                        <Badge variant={material.isSufficient ? "default" : "destructive"}>
                          {material.isSufficient ? "Cukup" : "Kurang"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Post Produksi (per run)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Run ID</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Produk Jadi</TableHead>
                <TableHead>Material Dipakai</TableHead>
                <TableHead>Nilai Konsumsi</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Belum ada riwayat post produksi.
                  </TableCell>
                </TableRow>
              ) : (
                runHistory.map((row) => (
                  <TableRow key={row.runId}>
                    <TableCell>{formatDateTime(row.occurredAt)}</TableCell>
                    <TableCell>{row.runId}</TableCell>
                    <TableCell>
                      {row.batchCount === null ? "-" : row.batchCount.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>
                      {row.producedQtyForStock === null
                        ? "-"
                        : row.producedQtyForStock.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>{row.materialLines} baris</TableCell>
                    <TableCell>{formatCurrency(row.totalConsumedValue)}</TableCell>
                    <TableCell>{row.note ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
