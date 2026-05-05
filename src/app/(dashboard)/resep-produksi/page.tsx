import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { calculateHpp, type CalculateHppResult } from "@/lib/hpp";
import {
  addRecipeCostAction,
  addRecipeMaterialAction,
  deleteRecipeCostAction,
  deleteRecipeMaterialAction,
  updateRecipeCostAction,
  updateRecipeMaterialAction,
  updateRecipeStatusAction,
} from "./actions";

type ResepProduksiPageProps = {
  searchParams?: Promise<{
    recipeId?: string;
    status?: "draft" | "active" | "archived";
  }>;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

const statusLabel = (status: string) => {
  if (status === "draft") return "Draf";
  if (status === "active") return "Aktif";
  if (status === "archived") return "Diarsipkan";
  return status;
};

const costTypeLabel = (type: string) => {
  if (type === "material") return "Bahan";
  if (type === "labor") return "Tenaga kerja";
  if (type === "overhead") return "Overhead";
  if (type === "other") return "Lainnya";
  return type;
};

const costBasisLabel = (basis: string) => {
  if (basis === "per_batch") return "Per batch";
  if (basis === "per_unit") return "Per unit hasil";
  return basis;
};

const itemTypeLabel = (type: string) => {
  if (type === "raw_material") return "Bahan utama";
  if (type === "packaging") return "Kemasan";
  if (type === "finished_good") return "Barang jadi";
  if (type === "service") return "Jasa";
  return type;
};

export default async function ResepProduksiPage({ searchParams }: ResepProduksiPageProps) {
  const params = (await searchParams) ?? {};
  const selectedStatus = params.status;

  const [recipeRows, availableItems, availableUnits] = await Promise.all([
    db.query.recipes.findMany({
      with: {
        productVariant: {
          columns: {
            id: true,
            sku: true,
            price: true,
          },
          with: {
            product: {
              columns: {
                name: true,
              },
            },
          },
        },
        outputUnit: {
          columns: {
            code: true,
          },
        },
        materials: {
          with: {
            item: {
              columns: {
                id: true,
                name: true,
              },
            },
            unit: {
              columns: {
                id: true,
                code: true,
              },
            },
          },
          orderBy: (table, { asc: ascOrder }) => [ascOrder(table.sortOrder), ascOrder(table.createdAt)],
        },
        costs: true,
      },
      orderBy: (table) => [desc(table.updatedAt)],
    }),
    db.query.costItems.findMany({
      columns: {
        id: true,
        name: true,
        itemType: true,
      },
      where: (table, { eq: eqOp }) => eqOp(table.isActive, true),
      orderBy: (table) => [asc(table.name)],
    }),
    db.query.units.findMany({
      columns: {
        id: true,
        code: true,
        dimension: true,
      },
      orderBy: (table) => [asc(table.code)],
    }),
  ]);

  const filteredRecipes =
    selectedStatus && ["draft", "active", "archived"].includes(selectedStatus)
      ? recipeRows.filter((item) => item.status === selectedStatus)
      : recipeRows;

  const selectedRecipe =
    filteredRecipes.find((item) => item.id === params.recipeId) ?? filteredRecipes[0] ?? null;

  let selectedHpp: CalculateHppResult | null = null;
  let hppError: string | null = null;
  if (selectedRecipe) {
    try {
      selectedHpp = await calculateHpp(selectedRecipe.id);
    } catch (error) {
      hppError = error instanceof Error ? error.message : "Gagal menghitung HPP resep";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Resep produksi</h1>
          <p className="text-sm text-muted-foreground">
            Kelola daftar bahan (BOM) dan biaya tambahan untuk menghitung HPP dengan lebih akurat.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/hpp">Buka Kalkulator HPP</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter resep</CardTitle>
          <CardDescription>Tampilkan resep berdasarkan status.</CardDescription>
        </CardHeader>
        <CardContent>
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Status</label>
              <select
                name="status"
                defaultValue={selectedStatus ?? ""}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 min-w-52 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="">Semua</option>
                <option value="draft">Draf</option>
                <option value="active">Aktif</option>
                <option value="archived">Diarsipkan</option>
              </select>
            </div>

            <Button type="submit">Terapkan</Button>
            <Button asChild type="button" variant="ghost">
              <Link href="/resep-produksi">Hapus filter</Link>
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar resep ({filteredRecipes.length})</CardTitle>
          <CardDescription>Pilih resep untuk melihat detail dan mengubah komponennya.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resep</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Hasil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Jumlah bahan</TableHead>
                <TableHead>Jumlah biaya tambahan</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecipes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Belum ada resep produksi sesuai filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecipes.map((recipe) => (
                  <TableRow key={recipe.id}>
                    <TableCell>{recipe.name}</TableCell>
                    <TableCell>
                      {recipe.productVariant.product.name}
                      <p className="text-xs text-muted-foreground">
                        SKU: {recipe.productVariant.sku ?? "-"}
                      </p>
                    </TableCell>
                    <TableCell>
                      {Number(recipe.outputQty).toLocaleString("id-ID")} {recipe.outputUnit.code}
                    </TableCell>
                    <TableCell>
                      <Badge variant={recipe.status === "active" ? "default" : "secondary"}>
                        {statusLabel(recipe.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{recipe.materials.length}</TableCell>
                    <TableCell>{recipe.costs.length}</TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/resep-produksi?recipeId=${recipe.id}${selectedStatus ? `&status=${selectedStatus}` : ""}`}>
                          Lihat detail
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detail resep</CardTitle>
          <CardDescription>Atur status, bahan resep, biaya tambahan, dan lihat ringkasan HPP.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedRecipe ? (
            <p className="text-sm text-muted-foreground">Pilih resep untuk melihat detail.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Produk</p>
                  <p className="font-medium">{selectedRecipe.productVariant.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    SKU: {selectedRecipe.productVariant.sku ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Hasil & susut</p>
                  <p className="font-medium">
                    {Number(selectedRecipe.outputQty).toLocaleString("id-ID")} {selectedRecipe.outputUnit.code}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Susut: {Number(selectedRecipe.lossPercent ?? 0).toLocaleString("id-ID")}%
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Status</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant={selectedRecipe.status === "active" ? "default" : "secondary"}>
                      {statusLabel(selectedRecipe.status)}
                    </Badge>
                    <form action={updateRecipeStatusAction} className="flex items-center gap-2">
                      <input type="hidden" name="recipeId" value={selectedRecipe.id} />
                      <select
                        name="status"
                        defaultValue={selectedRecipe.status}
                        className="border-input bg-background ring-offset-background focus-visible:ring-ring h-8 rounded-md border px-2 text-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        <option value="draft">Draf</option>
                        <option value="active">Aktif</option>
                        <option value="archived">Diarsipkan</option>
                      </select>
                      <Button type="submit" size="sm" variant="outline">
                        Simpan status
                      </Button>
                    </form>
                  </div>
                  {selectedRecipe.notes && (
                    <p className="mt-2 text-xs text-muted-foreground">{selectedRecipe.notes}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Daftar bahan (BOM)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bahan</TableHead>
                          <TableHead>Jumlah</TableHead>
                          <TableHead>Susut (%)</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRecipe.materials.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              Belum ada material.
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedRecipe.materials.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.item.name}</TableCell>
                              <TableCell>
                                {Number(item.qty).toLocaleString("id-ID")} {item.unit.code}
                              </TableCell>
                              <TableCell>
                                {Number(item.wastePercent ?? 0).toLocaleString("id-ID")}%
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-2">
                                  <form action={updateRecipeMaterialAction} className="flex flex-wrap items-center gap-2">
                                    <input type="hidden" name="materialId" value={item.id} />
                                    <input
                                      name="qty"
                                      type="number"
                                      step="0.0001"
                                      defaultValue={String(item.qty)}
                                      className="border-input bg-background h-8 w-20 rounded-md border px-2 text-xs"
                                      required
                                    />
                                    <input
                                      name="wastePercent"
                                      type="number"
                                      step="0.01"
                                      defaultValue={String(item.wastePercent ?? 0)}
                                      className="border-input bg-background h-8 w-20 rounded-md border px-2 text-xs"
                                    />
                                    <input
                                      name="sortOrder"
                                      type="number"
                                      step="1"
                                      defaultValue={String(item.sortOrder ?? 0)}
                                      className="border-input bg-background h-8 w-16 rounded-md border px-2 text-xs"
                                    />
                                    <label className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <input
                                        type="checkbox"
                                        name="isOptional"
                                        defaultChecked={item.isOptional ?? false}
                                      />
                                      Opsional
                                    </label>
                                    <Button type="submit" size="sm" variant="outline">
                                      Simpan
                                    </Button>
                                  </form>
                                  <form action={deleteRecipeMaterialAction}>
                                    <input type="hidden" name="materialId" value={item.id} />
                                    <Button type="submit" size="sm" variant="ghost">
                                      Hapus
                                    </Button>
                                  </form>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>

                    <form
                      action={addRecipeMaterialAction}
                      className="mt-3 grid grid-cols-1 gap-2 rounded-md border border-dashed p-3 md:grid-cols-7"
                    >
                      <input type="hidden" name="recipeId" value={selectedRecipe.id} />
                      <select
                        name="itemId"
                        defaultValue=""
                        className="border-input bg-background h-9 rounded-md border px-2 text-sm md:col-span-2"
                        required
                      >
                        <option value="" disabled>
                          Pilih item
                        </option>
                        {availableItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({itemTypeLabel(item.itemType)})
                          </option>
                        ))}
                      </select>
                      <input
                        name="qty"
                        type="number"
                        step="0.0001"
                        placeholder="Jumlah"
                        className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                        required
                      />
                      <select
                        name="unitId"
                        defaultValue=""
                        className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                        required
                      >
                        <option value="" disabled>
                          Satuan
                        </option>
                        {availableUnits.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.code} ({unit.dimension})
                          </option>
                        ))}
                      </select>
                      <input
                        name="wastePercent"
                        type="number"
                        step="0.01"
                        placeholder="Susut %"
                        className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                      />
                      <input
                        name="sortOrder"
                        type="number"
                        step="1"
                        placeholder="Urutan"
                        className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-xs text-muted-foreground">
                          <input type="checkbox" name="isOptional" />
                          Opsional
                        </label>
                        <Button type="submit" size="sm">
                          Tambah
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Biaya tambahan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Komponen</TableHead>
                          <TableHead>Jenis</TableHead>
                          <TableHead>Dasar hitung</TableHead>
                          <TableHead>Nominal</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRecipe.costs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              Tidak ada biaya tambahan.
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedRecipe.costs.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{costTypeLabel(item.componentType)}</TableCell>
                              <TableCell>{costBasisLabel(item.basis)}</TableCell>
                              <TableCell>{formatCurrency(Number(item.amount))}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-2">
                                  <form action={updateRecipeCostAction} className="flex flex-wrap items-center gap-2">
                                    <input type="hidden" name="costId" value={item.id} />
                                    <input
                                      name="name"
                                      defaultValue={item.name}
                                      className="border-input bg-background h-8 w-32 rounded-md border px-2 text-xs"
                                      required
                                    />
                                    <select
                                      name="componentType"
                                      defaultValue={item.componentType}
                                      className="border-input bg-background h-8 rounded-md border px-2 text-xs"
                                    >
                                      <option value="material">Bahan</option>
                                      <option value="labor">Tenaga kerja</option>
                                      <option value="overhead">Overhead</option>
                                      <option value="other">Lainnya</option>
                                    </select>
                                    <select
                                      name="basis"
                                      defaultValue={item.basis}
                                      className="border-input bg-background h-8 rounded-md border px-2 text-xs"
                                    >
                                      <option value="per_batch">Per batch</option>
                                      <option value="per_unit">Per unit hasil</option>
                                    </select>
                                    <input
                                      name="amount"
                                      type="number"
                                      step="0.0001"
                                      defaultValue={String(item.amount)}
                                      className="border-input bg-background h-8 w-24 rounded-md border px-2 text-xs"
                                      required
                                    />
                                    <Button type="submit" size="sm" variant="outline">
                                      Simpan
                                    </Button>
                                  </form>
                                  <form action={deleteRecipeCostAction}>
                                    <input type="hidden" name="costId" value={item.id} />
                                    <Button type="submit" size="sm" variant="ghost">
                                      Hapus
                                    </Button>
                                  </form>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>

                    <form
                      action={addRecipeCostAction}
                      className="mt-3 grid grid-cols-1 gap-2 rounded-md border border-dashed p-3 md:grid-cols-5"
                    >
                      <input type="hidden" name="recipeId" value={selectedRecipe.id} />
                      <input
                        name="name"
                        placeholder="Nama biaya"
                        className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                        required
                      />
                      <select
                        name="componentType"
                        defaultValue="overhead"
                        className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                      >
                        <option value="material">Bahan</option>
                        <option value="labor">Tenaga kerja</option>
                        <option value="overhead">Overhead</option>
                        <option value="other">Lainnya</option>
                      </select>
                      <select
                        name="basis"
                        defaultValue="per_batch"
                        className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                      >
                        <option value="per_batch">Per batch</option>
                        <option value="per_unit">Per unit hasil</option>
                      </select>
                      <input
                        name="amount"
                        type="number"
                        step="0.0001"
                        placeholder="Nominal"
                        className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                        required
                      />
                      <Button type="submit" size="sm">
                        Tambah
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ringkasan HPP resep</CardTitle>
                </CardHeader>
                <CardContent>
                  {hppError ? (
                    <p className="text-sm text-destructive">{hppError}</p>
                  ) : selectedHpp ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Biaya bahan</p>
                        <p className="font-semibold">{formatCurrency(selectedHpp.totals.materialCost)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Biaya tambahan</p>
                        <p className="font-semibold">{formatCurrency(selectedHpp.totals.additionalCost)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Total biaya per batch</p>
                        <p className="font-semibold">{formatCurrency(selectedHpp.totals.totalBatchCost)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">HPP per unit hasil</p>
                        <p className="font-semibold">{formatCurrency(selectedHpp.totals.hppPerOutputUnit)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Data HPP belum tersedia.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
