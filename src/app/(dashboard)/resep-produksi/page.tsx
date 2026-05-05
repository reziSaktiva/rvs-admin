import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription as FormFieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
  createProductVariantAndRecipeAction,
  createRecipeWithExistingVariantAction,
  createVariantAndRecipeForExistingProductAction,
  deleteRecipeCostAction,
  deleteRecipeMaterialAction,
  updateProductAndVariantAction,
  updateRecipeCostAction,
  updateRecipeMaterialAction,
  updateRecipeStatusAction,
} from "./actions";

type ResepProduksiPageProps = {
  searchParams?: Promise<{
    recipeId?: string;
    status?: "draft" | "active" | "archived";
    error?: string;
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

const errorLabel = (code?: string) => {
  if (!code) return null;
  const map: Record<string, string> = {
    nama_resep_duplikat: "Nama resep sudah dipakai pada varian ini.",
    sku_barcode_duplikat: "SKU atau barcode varian sudah dipakai.",
    nama_produk_wajib: "Nama produk wajib diisi.",
    produk_wajib: "Pilih produk terlebih dahulu.",
    varian_wajib: "Pilih varian terlebih dahulu.",
    harga_varian_invalid: "Harga varian harus angka valid (>= 0).",
    nama_resep_kosong: "Nama resep wajib diisi.",
    satuan_kosong: "Satuan hasil wajib dipilih.",
    qty_invalid: "Jumlah hasil per batch harus lebih dari 0.",
    susut_invalid: "Nilai susut harus di antara 0 sampai 100.",
    data_produk_tidak_lengkap: "Data produk/varian untuk update belum lengkap.",
  };
  return map[code] ?? "Terjadi kesalahan saat menyimpan data.";
};

export default async function ResepProduksiPage({ searchParams }: ResepProduksiPageProps) {
  const params = (await searchParams) ?? {};
  const selectedStatus = params.status;

  const [recipeRows, availableItems, availableUnits, categories, products, allVariants] = await Promise.all([
    db.query.recipes.findMany({
      with: {
        productVariant: {
          columns: {
            id: true,
            sku: true,
            size: true,
            barcode: true,
            price: true,
            stock: true,
            isActive: true,
          },
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                description: true,
                isActive: true,
                categoryId: true,
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
    db.query.categories.findMany({
      columns: {
        id: true,
        name: true,
      },
      orderBy: (table) => [asc(table.name)],
    }),
    db.query.product.findMany({
      columns: {
        id: true,
        name: true,
      },
      orderBy: (table) => [asc(table.name)],
    }),
    db.query.productVariant.findMany({
      columns: {
        id: true,
        sku: true,
        size: true,
        isActive: true,
      },
      with: {
        product: {
          columns: {
            name: true,
          },
        },
      },
      orderBy: (table) => [asc(table.createdAt)],
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

  const pageError = errorLabel(params.error);

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

      {pageError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {pageError}
        </div>
      ) : null}

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

      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <Card>
            <CardHeader>
              <CardTitle>Buat resep dari varian yang sudah ada</CardTitle>
              <CardDescription>Pilih varian lalu isi data resep.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createRecipeWithExistingVariantAction} className="space-y-3">
                <input type="hidden" name="status" value={selectedStatus ?? ""} />
                <select
                  name="productVariantId"
                  defaultValue=""
                  required
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                >
                  <option value="" disabled>
                    Pilih varian produk
                  </option>
                  {allVariants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.product.name} {variant.size ? `- ${variant.size}` : ""}{" "}
                      {variant.sku ? `(${variant.sku})` : ""}
                    </option>
                  ))}
                </select>
                <input
                  name="name"
                  placeholder="Nama resep"
                  required
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="outputQty"
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    placeholder="Hasil per batch"
                    required
                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  />
                  <select
                    name="outputUnitId"
                    defaultValue=""
                    required
                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  >
                    <option value="" disabled>
                      Satuan hasil
                    </option>
                    {availableUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.code}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  name="lossPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Susut (%)"
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                />
                <Button type="submit" size="sm">
                  Buat resep
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produk ada, varian baru</CardTitle>
              <CardDescription>Buat varian baru untuk produk lama lalu langsung buat resep.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createVariantAndRecipeForExistingProductAction} className="space-y-3">
                <input type="hidden" name="status" value={selectedStatus ?? ""} />
                <select
                  name="productId"
                  defaultValue=""
                  required
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                >
                  <option value="" disabled>
                    Pilih produk
                  </option>
                  {products.map((productItem) => (
                    <option key={productItem.id} value={productItem.id}>
                      {productItem.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="variantSize"
                    placeholder="Ukuran varian"
                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  />
                  <input
                    name="variantSku"
                    placeholder="SKU varian"
                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="variantBarcode"
                    placeholder="Barcode"
                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  />
                  <input
                    name="variantPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Harga jual"
                    required
                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  />
                </div>
                <input
                  name="variantStock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Stok awal"
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                />
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" name="variantIsActive" defaultChecked />
                  Varian aktif
                </label>
                <input
                  name="name"
                  placeholder="Nama resep"
                  required
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="outputQty"
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    placeholder="Hasil per batch"
                    required
                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  />
                  <select
                    name="outputUnitId"
                    defaultValue=""
                    required
                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  >
                    <option value="" disabled>
                      Satuan hasil
                    </option>
                    {availableUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.code}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  name="lossPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Susut (%)"
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                />
                <Button type="submit" size="sm" variant="secondary">
                  Buat varian + resep
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produk baru + varian + resep</CardTitle>
              <CardDescription>Semua dibuat langsung dari halaman resep produksi.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createProductVariantAndRecipeAction} className="space-y-3">
                <input type="hidden" name="status" value={selectedStatus ?? ""} />
                <input
                  name="productName"
                  placeholder="Nama produk"
                  required
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                />
                <textarea
                  name="productDescription"
                  placeholder="Deskripsi produk (opsional)"
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                />
                <select
                  name="categoryId"
                  defaultValue=""
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                >
                  <option value="">Tanpa kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" name="productIsActive" defaultChecked />
                  Produk aktif
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="variantSize"
                    placeholder="Ukuran varian"
                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  />
                  <input
                    name="variantSku"
                    placeholder="SKU varian"
                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="variantBarcode"
                    placeholder="Barcode"
                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  />
                  <input
                    name="variantPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Harga jual"
                    required
                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  />
                </div>
                <input
                  name="variantStock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Stok awal"
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                />
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" name="variantIsActive" defaultChecked />
                  Varian aktif
                </label>
                <input
                  name="name"
                  placeholder="Nama resep"
                  required
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="outputQty"
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    placeholder="Hasil per batch"
                    required
                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  />
                  <select
                    name="outputUnitId"
                    defaultValue=""
                    required
                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  >
                    <option value="" disabled>
                      Satuan hasil
                    </option>
                    {availableUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.code}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  name="lossPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Susut (%)"
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                />
                <Button type="submit" size="sm" variant="secondary">
                  Buat produk + varian + resep
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-8">
          {!selectedRecipe ? (
            <Card>
              <CardHeader>
                <CardTitle>Detail resep</CardTitle>
                <CardDescription>Pilih resep dari tabel untuk melihat detail BOM dan biaya.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Produk & varian resep terpilih</CardTitle>
                  <CardDescription>
                    Anda bisa ubah informasi produk/varian langsung di sini tanpa pindah halaman.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={updateProductAndVariantAction} className="space-y-3">
                    <input type="hidden" name="recipeId" value={selectedRecipe.id} />
                    <input type="hidden" name="productId" value={selectedRecipe.productVariant.product.id} />
                    <input type="hidden" name="variantId" value={selectedRecipe.productVariant.id} />
                    <input type="hidden" name="status" value={selectedStatus ?? ""} />
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <input
                        name="productName"
                        defaultValue={selectedRecipe.productVariant.product.name}
                        required
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                      />
                      <select
                        name="categoryId"
                        defaultValue={selectedRecipe.productVariant.product.categoryId ?? ""}
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                      >
                        <option value="">Tanpa kategori</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      name="productDescription"
                      defaultValue={selectedRecipe.productVariant.product.description ?? ""}
                      className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                      placeholder="Deskripsi produk"
                    />
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <input
                        name="variantSize"
                        defaultValue={selectedRecipe.productVariant.size ?? ""}
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                        placeholder="Ukuran varian"
                      />
                      <input
                        name="variantSku"
                        defaultValue={selectedRecipe.productVariant.sku ?? ""}
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                        placeholder="SKU varian"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <input
                        name="variantBarcode"
                        defaultValue={selectedRecipe.productVariant.barcode ?? ""}
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                        placeholder="Barcode varian"
                      />
                      <input
                        name="variantPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={String(selectedRecipe.productVariant.price)}
                        required
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                        placeholder="Harga jual"
                      />
                    </div>
                    <input
                      name="variantStock"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={String(selectedRecipe.productVariant.stock ?? 0)}
                      className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                      placeholder="Stok varian"
                    />
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="productIsActive"
                          defaultChecked={selectedRecipe.productVariant.product.isActive ?? true}
                        />
                        Produk aktif
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="variantIsActive"
                          defaultChecked={selectedRecipe.productVariant.isActive ?? true}
                        />
                        Varian aktif
                      </label>
                    </div>
                    <Button type="submit" size="sm" variant="outline">
                      Simpan data produk/varian
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detail resep</CardTitle>
                  <CardDescription>
                    Atur status, bahan resep, biaya tambahan, dan lihat ringkasan HPP.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                                      <form
                                        action={updateRecipeMaterialAction}
                                        className="grid w-full grid-cols-1 gap-2 md:grid-cols-6"
                                      >
                                        <input type="hidden" name="materialId" value={item.id} />
                                        <Field>
                                          <FieldLabel htmlFor={`mat-qty-${item.id}`} className="sr-only">
                                            Jumlah
                                          </FieldLabel>
                                          <Input
                                            id={`mat-qty-${item.id}`}
                                            name="qty"
                                            type="number"
                                            step="0.0001"
                                            defaultValue={String(item.qty)}
                                            className="h-8 text-xs"
                                            required
                                          />
                                        </Field>
                                        <Field>
                                          <FieldLabel htmlFor={`mat-waste-${item.id}`} className="sr-only">
                                            Susut
                                          </FieldLabel>
                                          <Input
                                            id={`mat-waste-${item.id}`}
                                            name="wastePercent"
                                            type="number"
                                            step="0.01"
                                            defaultValue={String(item.wastePercent ?? 0)}
                                            className="h-8 text-xs"
                                          />
                                        </Field>
                                        <Field>
                                          <FieldLabel htmlFor={`mat-order-${item.id}`} className="sr-only">
                                            Urutan
                                          </FieldLabel>
                                          <Input
                                            id={`mat-order-${item.id}`}
                                            name="sortOrder"
                                            type="number"
                                            step="1"
                                            defaultValue={String(item.sortOrder ?? 0)}
                                            className="h-8 text-xs"
                                          />
                                        </Field>
                                        <Field className="flex items-center gap-2 pt-1">
                                          <input
                                            id={`mat-opt-${item.id}`}
                                            type="checkbox"
                                            name="isOptional"
                                            defaultChecked={item.isOptional ?? false}
                                          />
                                          <FieldLabel htmlFor={`mat-opt-${item.id}`} className="text-xs">
                                            Opsional
                                          </FieldLabel>
                                        </Field>
                                        <div className="md:col-span-2">
                                          <Button type="submit" size="sm" variant="outline">
                                            Simpan
                                          </Button>
                                        </div>
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
                          className="mt-3 rounded-md border border-dashed p-3"
                        >
                          <input type="hidden" name="recipeId" value={selectedRecipe.id} />
                          <FieldGroup className="grid grid-cols-1 gap-2 md:grid-cols-7">
                            <Field className="md:col-span-2">
                              <FieldLabel htmlFor="new-material-item" className="sr-only">
                                Item bahan
                              </FieldLabel>
                              <select
                                id="new-material-item"
                                name="itemId"
                                defaultValue=""
                                className="border-input bg-background h-9 rounded-md border px-2 text-sm"
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
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="new-material-qty" className="sr-only">
                                Jumlah
                              </FieldLabel>
                              <Input
                                id="new-material-qty"
                                name="qty"
                                type="number"
                                step="0.0001"
                                placeholder="Jumlah"
                                required
                              />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="new-material-unit" className="sr-only">
                                Satuan
                              </FieldLabel>
                              <select
                                id="new-material-unit"
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
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="new-material-waste" className="sr-only">
                                Susut
                              </FieldLabel>
                              <Input
                                id="new-material-waste"
                                name="wastePercent"
                                type="number"
                                step="0.01"
                                placeholder="Susut %"
                              />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="new-material-order" className="sr-only">
                                Urutan
                              </FieldLabel>
                              <Input
                                id="new-material-order"
                                name="sortOrder"
                                type="number"
                                step="1"
                                placeholder="Urutan"
                              />
                            </Field>
                            <Field className="flex items-center gap-2">
                              <input id="new-material-optional" type="checkbox" name="isOptional" />
                              <FieldLabel htmlFor="new-material-optional" className="text-xs">
                                Opsional
                              </FieldLabel>
                            </Field>
                          </FieldGroup>
                          <FormFieldDescription className="mt-2">
                            Isi bahan yang dipakai per batch untuk resep ini.
                          </FormFieldDescription>
                          <Button type="submit" size="sm" className="mt-3">
                            Tambah
                          </Button>
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
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
