import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription as FormFieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { PencilIcon, TrashIcon } from "lucide-react";

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
  const statusParam = params.status as string | undefined;
  const selectedStatus = statusParam === "__all" ? undefined : params.status;

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
              <Select name="status" defaultValue={selectedStatus ?? "__all"}>
                <SelectTrigger className="min-w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Semua</SelectItem>
                  <SelectItem value="draft">Draf</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="archived">Diarsipkan</SelectItem>
                </SelectContent>
              </Select>
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
                <Select name="productVariantId" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih varian produk" />
                  </SelectTrigger>
                  <SelectContent>
                    {allVariants.map((variant) => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.product.name} {variant.size ? `- ${variant.size}` : ""}{" "}
                        {variant.sku ? `(${variant.sku})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input name="name" placeholder="Nama resep" required />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    name="outputQty"
                    type="number"
                    min="0.0001"
                    step="1"
                    placeholder="Hasil per batch"
                    required
                  />
                  <Select name="outputUnitId" required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Satuan hasil" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  name="lossPercent"
                  type="number"
                  min="0"
                  max="0"
                  step="0.01"
                  placeholder="Susut (%)"
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
                <Select name="productId" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((productItem) => (
                      <SelectItem key={productItem.id} value={productItem.id}>
                        {productItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    name="variantSize"
                    placeholder="Ukuran varian"
                  />
                  <Input
                    name="variantSku"
                    placeholder="SKU varian"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    name="variantBarcode"
                    placeholder="Barcode"
                  />
                  <Input
                    name="variantPrice"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Harga jual"
                    required
                  />
                </div>
                <Input
                  name="variantStock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Stok awal"
                />
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox name="variantIsActive" defaultChecked />
                  Varian aktif
                </label>
                <Input
                  name="name"
                  placeholder="Nama resep"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    name="outputQty"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Hasil per batch"
                    required
                  />
                  <Select name="outputUnitId" required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Satuan hasil" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  name="lossPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Susut (%)"
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
                <Input name="productName" placeholder="Nama produk" required />
                <textarea
                  name="productDescription"
                  placeholder="Deskripsi produk (opsional)"
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                />
                <Select name="categoryId" defaultValue="__none">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Tanpa kategori</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox name="productIsActive" defaultChecked />
                  Produk aktif
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    name="variantSize"
                    placeholder="Ukuran varian"
                  />
                  <Input
                    name="variantSku"
                    placeholder="SKU varian"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    name="variantBarcode"
                    placeholder="Barcode"
                  />
                  <Input
                    name="variantPrice"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Harga jual"
                    required
                  />
                </div>
                <Input
                  name="variantStock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Stok awal"
                />
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox name="variantIsActive" defaultChecked />
                  Varian aktif
                </label>
                <Input
                  name="name"
                  placeholder="Nama resep"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    name="outputQty"
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    placeholder="Hasil per batch"
                    required
                  />
                  <Select name="outputUnitId" required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Satuan hasil" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  name="lossPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Susut (%)"
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
                      <Input
                        name="productName"
                        defaultValue={selectedRecipe.productVariant.product.name}
                        required
                      />
                      <Select
                        name="categoryId"
                        defaultValue={selectedRecipe.productVariant.product.categoryId ?? "__none"}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">Tanpa kategori</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <textarea
                      name="productDescription"
                      defaultValue={selectedRecipe.productVariant.product.description ?? ""}
                      className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                      placeholder="Deskripsi produk"
                    />
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <Input
                        name="variantSize"
                        defaultValue={selectedRecipe.productVariant.size ?? ""}
                        placeholder="Ukuran varian"
                      />
                      <Input
                        name="variantSku"
                        defaultValue={selectedRecipe.productVariant.sku ?? ""}
                        placeholder="SKU varian"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <Input
                        name="variantBarcode"
                        defaultValue={selectedRecipe.productVariant.barcode ?? ""}
                        placeholder="Barcode varian"
                      />
                      <Input
                        name="variantPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={String(selectedRecipe.productVariant.price)}
                        required
                        placeholder="Harga jual"
                      />
                    </div>
                    <Input
                      name="variantStock"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={String(selectedRecipe.productVariant.stock ?? 0)}
                      placeholder="Stok varian"
                    />
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <label className="flex items-center gap-2">
                        <Checkbox
                          name="productIsActive"
                          defaultChecked={selectedRecipe.productVariant.product.isActive ?? true}
                        />
                        Produk aktif
                      </label>
                      <label className="flex items-center gap-2">
                        <Checkbox
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
                          <Select name="status" defaultValue={selectedRecipe.status}>
                            <SelectTrigger className="h-8 w-[140px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draf</SelectItem>
                              <SelectItem value="active">Aktif</SelectItem>
                              <SelectItem value="archived">Diarsipkan</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button type="submit" size="sm" variant="outline">
                            Simpan status
                          </Button>
                        </form>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
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
                                    <div className="flex flex-col gap-2">
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button type="button" size="sm" variant="secondary" className="w-full">
                                            Edit <PencilIcon />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                          <DialogHeader>
                                            <DialogTitle>Edit bahan resep</DialogTitle>
                                            <DialogDescription>
                                              Ubah jumlah, susut, dan urutan bahan pada resep ini.
                                            </DialogDescription>
                                          </DialogHeader>
                                          <form action={updateRecipeMaterialAction} className="space-y-3">
                                            <input type="hidden" name="materialId" value={item.id} />
                                            <Field>
                                              <FieldLabel htmlFor={`edit-mat-qty-${item.id}`}>Jumlah</FieldLabel>
                                              <Input
                                                id={`edit-mat-qty-${item.id}`}
                                                name="qty"
                                                type="number"
                                                step="1"
                                                defaultValue={String(item.qty)}
                                                required
                                              />
                                            </Field>
                                            <Field>
                                              <FieldLabel htmlFor={`edit-mat-waste-${item.id}`}>Susut (%)</FieldLabel>
                                              <Input
                                                id={`edit-mat-waste-${item.id}`}
                                                name="wastePercent"
                                                type="number"
                                                step="0.01"
                                                defaultValue={String(item.wastePercent ?? 0)}
                                              />
                                            </Field>
                                            <Field>
                                              <FieldLabel htmlFor={`edit-mat-order-${item.id}`}>Urutan</FieldLabel>
                                              <Input
                                                id={`edit-mat-order-${item.id}`}
                                                name="sortOrder"
                                                type="number"
                                                step="1"
                                                defaultValue={String(item.sortOrder ?? 0)}
                                              />
                                            </Field>
                                            <Field className="flex items-center gap-2">
                                              <Checkbox
                                                id={`edit-mat-opt-${item.id}`}
                                                name="isOptional"
                                                defaultChecked={item.isOptional ?? false}
                                              />
                                              <FieldLabel htmlFor={`edit-mat-opt-${item.id}`}>Opsional</FieldLabel>
                                            </Field>
                                            <DialogFooter>
                                              <DialogClose asChild>
                                                <Button type="button" variant="outline">
                                                  Batal
                                                </Button>
                                              </DialogClose>
                                              <Button type="submit">Simpan</Button>
                                            </DialogFooter>
                                          </form>
                                        </DialogContent>
                                      </Dialog>
                                      <form action={deleteRecipeMaterialAction} className="w-full">
                                        <input type="hidden" name="materialId" value={item.id} />
                                        <Button type="submit" size="sm" variant="destructive" className="w-full">
                                          Hapus <TrashIcon />
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
                              <Select name="itemId" required>
                                <SelectTrigger id="new-material-item" className="w-full">
                                  <SelectValue placeholder="Pilih item" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableItems.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.name} ({itemTypeLabel(item.itemType)})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                              <Select name="unitId" required>
                                <SelectTrigger id="new-material-unit" className="w-full">
                                  <SelectValue placeholder="Satuan" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableUnits.map((unit) => (
                                    <SelectItem key={unit.id} value={unit.id}>
                                      {unit.code} ({unit.dimension})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                              <Checkbox id="new-material-optional" name="isOptional" />
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
                                    <div className="flex flex-col gap-2">
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button type="button" size="sm" variant="secondary" className="w-full">
                                            Edit <PencilIcon />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                          <DialogHeader>
                                            <DialogTitle>Edit biaya tambahan</DialogTitle>
                                            <DialogDescription>
                                              Ubah nama, jenis biaya, dasar hitung, dan nominal.
                                            </DialogDescription>
                                          </DialogHeader>
                                          <form action={updateRecipeCostAction} className="space-y-3">
                                            <input type="hidden" name="costId" value={item.id} />
                                            <Field>
                                              <FieldLabel htmlFor={`edit-cost-name-${item.id}`}>Nama biaya</FieldLabel>
                                              <Input
                                                id={`edit-cost-name-${item.id}`}
                                                name="name"
                                                defaultValue={item.name}
                                                required
                                              />
                                            </Field>
                                            <Field>
                                              <FieldLabel>Jenis biaya</FieldLabel>
                                              <Select name="componentType" defaultValue={item.componentType}>
                                                <SelectTrigger className="w-full">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="material">Bahan</SelectItem>
                                                  <SelectItem value="labor">Tenaga kerja</SelectItem>
                                                  <SelectItem value="overhead">Overhead</SelectItem>
                                                  <SelectItem value="other">Lainnya</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </Field>
                                            <Field>
                                              <FieldLabel>Dasar hitung</FieldLabel>
                                              <Select name="basis" defaultValue={item.basis}>
                                                <SelectTrigger className="w-full">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="per_batch">Per batch</SelectItem>
                                                  <SelectItem value="per_unit">Per unit hasil</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </Field>
                                            <Field>
                                              <FieldLabel htmlFor={`edit-cost-amount-${item.id}`}>Nominal</FieldLabel>
                                              <Input
                                                id={`edit-cost-amount-${item.id}`}
                                                name="amount"
                                                type="number"
                                                step="100"
                                                defaultValue={String(item.amount)}
                                                required
                                              />
                                            </Field>
                                            <DialogFooter>
                                              <DialogClose asChild>
                                                <Button type="button" variant="outline">
                                                  Batal
                                                </Button>
                                              </DialogClose>
                                              <Button type="submit">Simpan</Button>
                                            </DialogFooter>
                                          </form>
                                        </DialogContent>
                                      </Dialog>
                                      <form action={deleteRecipeCostAction} className="w-full">
                                        <input type="hidden" name="costId" value={item.id} />
                                        <Button type="submit" size="sm" variant="destructive" className="w-full">
                                          Hapus <TrashIcon />
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
                          <Input
                            name="name"
                            placeholder="Nama biaya"
                            required
                          />
                          <Select name="componentType" defaultValue="overhead">
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="material">Bahan</SelectItem>
                              <SelectItem value="labor">Tenaga kerja</SelectItem>
                              <SelectItem value="overhead">Overhead</SelectItem>
                              <SelectItem value="other">Lainnya</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select name="basis" defaultValue="per_batch">
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="per_batch">Per batch</SelectItem>
                              <SelectItem value="per_unit">Per unit hasil</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            name="amount"
                            type="number"
                            step="100"
                            placeholder="Nominal"
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
