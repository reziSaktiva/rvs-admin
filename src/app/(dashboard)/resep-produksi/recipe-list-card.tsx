import Link from "next/link";
import { PencilIcon, TrashIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Field, FieldDescription as FormFieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addRecipeCostAction,
  addRecipeMaterialAction,
  createProductVariantAndRecipeAction,
  createRecipeWithExistingVariantAction,
  createVariantAndRecipeForExistingProductAction,
  deleteRecipeCostAction,
  deleteRecipeMaterialAction,
  updateRecipeCoreAction,
  updateRecipeCostAction,
  updateRecipeMaterialAction,
  updateRecipeStatusAction,
} from "./actions";
import type { RecipeRow, ResepProduksiPageData } from "./data";
import { costBasisLabel, costTypeLabel, formatCurrency, itemTypeLabel, statusLabel, type RecipeStatus } from "./view-model";

type RecipeListCardProps = {
  recipes: RecipeRow[];
  selectedStatus?: RecipeStatus;
  availableItems: ResepProduksiPageData["availableItems"];
  availableUnits: ResepProduksiPageData["availableUnits"];
  categories: ResepProduksiPageData["categories"];
  products: ResepProduksiPageData["products"];
  allVariants: ResepProduksiPageData["allVariants"];
};

export function RecipeListCard({
  recipes,
  selectedStatus,
  availableItems,
  availableUnits,
  categories,
  products,
  allVariants,
}: RecipeListCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Daftar resep ({recipes.length})</CardTitle>
            <CardDescription>Pilih resep untuk melihat detail dan mengubah komponennya.</CardDescription>
          </div>
          <Drawer direction="right">
            <DrawerTrigger asChild>
              <Button>Tambah resep</Button>
            </DrawerTrigger>
            <DrawerContent className="h-dvh max-h-dvh overflow-hidden data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-2xl">
              <DrawerHeader className="shrink-0 border-b">
                <DrawerTitle>Tambah resep baru</DrawerTitle>
                <DrawerDescription>
                  Buat resep sekaligus isi nama resep dari varian yang sudah ada atau sambil membuat data
                  produk/varian baru.
                </DrawerDescription>
              </DrawerHeader>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                <Tabs defaultValue="existing-variant" className="space-y-3">
                  <TabsList className="grid h-auto w-full grid-cols-1 gap-1 md:grid-cols-3">
                    <TabsTrigger value="existing-variant">Varian sudah ada</TabsTrigger>
                    <TabsTrigger value="existing-product">Produk ada, varian baru</TabsTrigger>
                    <TabsTrigger value="new-product">Produk + varian baru</TabsTrigger>
                  </TabsList>

                  <TabsContent value="existing-variant">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Pakai varian yang sudah ada</CardTitle>
                        <CardDescription>
                          Pilih varian lalu isi nama resep, hasil per batch, dan satuan hasil.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form action={createRecipeWithExistingVariantAction} className="space-y-3">
                          <input type="hidden" name="status" value={selectedStatus ?? ""} />
                          <Field>
                            <FieldLabel htmlFor="create-existing-variant">Varian produk</FieldLabel>
                            <Select name="productVariantId" required>
                              <SelectTrigger id="create-existing-variant" className="w-full">
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
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="create-existing-name">Nama resep</FieldLabel>
                            <Input id="create-existing-name" name="name" placeholder="Contoh: Resep Regular" required />
                          </Field>
                          <div className="grid grid-cols-2 gap-2">
                            <Field>
                              <FieldLabel htmlFor="create-existing-output-qty">Hasil per batch</FieldLabel>
                              <Input
                                id="create-existing-output-qty"
                                name="outputQty"
                                type="number"
                                min="0.0001"
                                step="1"
                                required
                              />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="create-existing-output-unit">Satuan hasil</FieldLabel>
                              <Select name="outputUnitId" required>
                                <SelectTrigger id="create-existing-output-unit" className="w-full">
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
                            </Field>
                          </div>
                          <Field>
                            <FieldLabel htmlFor="create-existing-loss">Susut (%)</FieldLabel>
                            <Input id="create-existing-loss" name="lossPercent" type="number" min="0" max="100" step="0.01" />
                          </Field>
                          <Button type="submit" className="w-full">
                            Buat resep
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="existing-product">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Produk sudah ada, buat varian baru</CardTitle>
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
                            <Input name="variantSize" placeholder="Ukuran varian" />
                            <Input name="variantSku" placeholder="SKU varian" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input name="variantBarcode" placeholder="Barcode" />
                            <Input name="variantPrice" type="number" min="0" step="100" placeholder="Harga jual" required />
                          </div>
                          <Input name="variantStock" type="number" min="0" step="1" placeholder="Stok awal" />
                          <label className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Checkbox name="variantIsActive" defaultChecked />
                            Varian aktif
                          </label>
                          <Input name="name" placeholder="Nama resep" required />
                          <div className="grid grid-cols-2 gap-2">
                            <Input name="outputQty" type="number" min="0.0001" step="0.01" placeholder="Hasil per batch" required />
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
                          <Input name="lossPercent" type="number" min="0" max="100" step="0.01" placeholder="Susut (%)" />
                          <Button type="submit" className="w-full" variant="secondary">
                            Buat varian + resep
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="new-product">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Produk baru + varian + resep</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form action={createProductVariantAndRecipeAction} className="space-y-3">
                          <input type="hidden" name="status" value={selectedStatus ?? ""} />
                          <Input name="productName" placeholder="Nama produk" required />
                          <Input name="productDescription" placeholder="Deskripsi produk (opsional)" />
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
                            <Input name="variantSize" placeholder="Ukuran varian" />
                            <Input name="variantSku" placeholder="SKU varian" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input name="variantBarcode" placeholder="Barcode" />
                            <Input name="variantPrice" type="number" min="0" step="100" placeholder="Harga jual" required />
                          </div>
                          <Input name="variantStock" type="number" min="0" step="1" placeholder="Stok awal" />
                          <label className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Checkbox name="variantIsActive" defaultChecked />
                            Varian aktif
                          </label>
                          <Input name="name" placeholder="Nama resep" required />
                          <div className="grid grid-cols-2 gap-2">
                            <Input name="outputQty" type="number" min="0.0001" step="0.0001" placeholder="Hasil per batch" required />
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
                          <Input name="lossPercent" type="number" min="0" max="100" step="0.01" placeholder="Susut (%)" />
                          <Button type="submit" className="w-full" variant="secondary">
                            Buat produk + varian + resep
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
              <DrawerFooter className="shrink-0 border-t">
                <DrawerClose asChild>
                  <Button type="button" variant="outline">
                    Tutup
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Varian</TableHead>
              <TableHead>Resep</TableHead>
              <TableHead>Hasil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Jumlah bahan</TableHead>
              <TableHead>Jumlah biaya tambahan</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Belum ada resep produksi sesuai filter.
                </TableCell>
              </TableRow>
            ) : (
              recipes.map((recipe) => (
                <TableRow key={recipe.id}>
                  <TableCell>
                    {recipe.productVariant.product.name}
                    <p className="text-xs text-muted-foreground">SKU: {recipe.productVariant.sku ?? "-"}</p>
                  </TableCell>
                  <TableCell>{recipe.productVariant.size ? `${recipe.productVariant.size}` : "-"}</TableCell>
                  <TableCell>{recipe.name}</TableCell>
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
                    <Drawer direction="right">
                      <DrawerTrigger asChild>
                        <Button type="button" size="sm" variant="outline">
                          Kelola resep
                        </Button>
                      </DrawerTrigger>
                      <DrawerContent className="h-dvh max-h-dvh overflow-hidden data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-4xl">
                        <DrawerHeader className="shrink-0 border-b">
                          <DrawerTitle>Kelola resep: {recipe.name}</DrawerTitle>
                          <DrawerDescription>
                            Ubah nama resep, hasil batch, status, bahan, biaya tambahan, dan cek ringkasan HPP.
                          </DrawerDescription>
                        </DrawerHeader>
                        <div className="min-h-0 flex-1 overflow-y-auto p-4">
                          <Card className="mb-4">
                            <CardHeader>
                              <CardTitle className="text-base">Informasi resep</CardTitle>
                              <CardDescription>
                                Nama resep dan parameter hasil batch sebaiknya diisi dulu sebelum mengubah BOM.
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <form action={updateRecipeCoreAction} className="space-y-3">
                                <input type="hidden" name="recipeId" value={recipe.id} />
                                <input type="hidden" name="statusFilter" value={selectedStatus ?? ""} />
                                <Field>
                                  <FieldLabel htmlFor={`recipe-name-${recipe.id}`}>Nama resep</FieldLabel>
                                  <Input id={`recipe-name-${recipe.id}`} name="name" defaultValue={recipe.name} required />
                                </Field>
                                <FieldGroup className="grid grid-cols-1 gap-2 md:grid-cols-4">
                                  <Field className="md:col-span-2">
                                    <FieldLabel htmlFor={`recipe-output-qty-${recipe.id}`}>Hasil per batch</FieldLabel>
                                    <Input
                                      id={`recipe-output-qty-${recipe.id}`}
                                      name="outputQty"
                                      type="number"
                                      min="0.0001"
                                      step="0.0001"
                                      defaultValue={String(recipe.outputQty)}
                                      required
                                    />
                                  </Field>
                                  <Field>
                                    <FieldLabel htmlFor={`recipe-output-unit-${recipe.id}`}>Satuan hasil</FieldLabel>
                                    <Select name="outputUnitId" defaultValue={recipe.outputUnit.id} required>
                                      <SelectTrigger id={`recipe-output-unit-${recipe.id}`} className="w-full">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableUnits.map((unit) => (
                                          <SelectItem key={unit.id} value={unit.id}>
                                            {unit.code}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </Field>
                                  <Field>
                                    <FieldLabel htmlFor={`recipe-loss-${recipe.id}`}>Susut (%)</FieldLabel>
                                    <Input
                                      id={`recipe-loss-${recipe.id}`}
                                      name="lossPercent"
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                      defaultValue={String(recipe.lossPercent ?? 0)}
                                    />
                                  </Field>
                                </FieldGroup>
                                <Field className="max-w-[220px]">
                                  <FieldLabel htmlFor={`recipe-status-${recipe.id}`}>Status</FieldLabel>
                                  <Select name="status" defaultValue={recipe.status}>
                                    <SelectTrigger id={`recipe-status-${recipe.id}`} className="w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="draft">Draf</SelectItem>
                                      <SelectItem value="active">Aktif</SelectItem>
                                      <SelectItem value="archived">Diarsipkan</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </Field>
                                <Button type="submit" size="sm">
                                  Simpan informasi resep
                                </Button>
                              </form>
                            </CardContent>
                          </Card>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                              <p className="text-xs uppercase text-muted-foreground">Produk</p>
                              <p className="font-medium">{recipe.productVariant.product.name}</p>
                              <p className="text-xs text-muted-foreground">SKU: {recipe.productVariant.sku ?? "-"}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase text-muted-foreground">Hasil & susut</p>
                              <p className="font-medium">
                                {Number(recipe.outputQty).toLocaleString("id-ID")} {recipe.outputUnit.code}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Susut: {Number(recipe.lossPercent ?? 0).toLocaleString("id-ID")}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase text-muted-foreground">Status</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <Badge variant={recipe.status === "active" ? "default" : "secondary"}>
                                  {statusLabel(recipe.status)}
                                </Badge>
                                <form action={updateRecipeStatusAction} className="flex items-center gap-2">
                                  <input type="hidden" name="recipeId" value={recipe.id} />
                                  <Select name="status" defaultValue={recipe.status}>
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
                                    {recipe.materials.length === 0 ? (
                                      <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                                          Belum ada material.
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      recipe.materials.map((item) => (
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
                                                      <Checkbox id={`edit-mat-opt-${item.id}`} name="isOptional" defaultChecked={item.isOptional ?? false} />
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

                                <form action={addRecipeMaterialAction} className="mt-3 rounded-md border border-dashed p-3">
                                  <input type="hidden" name="recipeId" value={recipe.id} />
                                  <FieldGroup className="grid grid-cols-1 gap-2 md:grid-cols-7">
                                    <Field className="md:col-span-2">
                                      <FieldLabel htmlFor={`new-material-item-${recipe.id}`} className="sr-only">
                                        Item bahan
                                      </FieldLabel>
                                      <Select name="itemId" required>
                                        <SelectTrigger id={`new-material-item-${recipe.id}`} className="w-full">
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
                                      <FieldLabel htmlFor={`new-material-qty-${recipe.id}`} className="sr-only">
                                        Jumlah
                                      </FieldLabel>
                                      <Input
                                        id={`new-material-qty-${recipe.id}`}
                                        name="qty"
                                        type="number"
                                        step="0.0001"
                                        placeholder="Jumlah"
                                        required
                                      />
                                    </Field>
                                    <Field>
                                      <FieldLabel htmlFor={`new-material-unit-${recipe.id}`} className="sr-only">
                                        Satuan
                                      </FieldLabel>
                                      <Select name="unitId" required>
                                        <SelectTrigger id={`new-material-unit-${recipe.id}`} className="w-full">
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
                                      <FieldLabel htmlFor={`new-material-waste-${recipe.id}`} className="sr-only">
                                        Susut
                                      </FieldLabel>
                                      <Input
                                        id={`new-material-waste-${recipe.id}`}
                                        name="wastePercent"
                                        type="number"
                                        step="0.01"
                                        placeholder="Susut %"
                                      />
                                    </Field>
                                    <Field>
                                      <FieldLabel htmlFor={`new-material-order-${recipe.id}`} className="sr-only">
                                        Urutan
                                      </FieldLabel>
                                      <Input
                                        id={`new-material-order-${recipe.id}`}
                                        name="sortOrder"
                                        type="number"
                                        step="1"
                                        placeholder="Urutan"
                                      />
                                    </Field>
                                    <Field className="flex items-center gap-2">
                                      <Checkbox id={`new-material-optional-${recipe.id}`} name="isOptional" />
                                      <FieldLabel htmlFor={`new-material-optional-${recipe.id}`} className="text-xs">
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
                                    {recipe.costs.length === 0 ? (
                                      <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                          Tidak ada biaya tambahan.
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      recipe.costs.map((item) => (
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
                                                      <Input id={`edit-cost-name-${item.id}`} name="name" defaultValue={item.name} required />
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

                                <form action={addRecipeCostAction} className="mt-3 grid grid-cols-1 gap-2 rounded-md border border-dashed p-3 md:grid-cols-5">
                                  <input type="hidden" name="recipeId" value={recipe.id} />
                                  <Input name="name" placeholder="Nama biaya" required />
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
                                  <Input name="amount" type="number" step="100" placeholder="Nominal" required />
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
                              <p className="text-sm text-muted-foreground">
                                Untuk melihat perhitungan HPP terkini berdasarkan resep ini, buka halaman kalkulator HPP.
                              </p>
                              <Button asChild size="sm" variant="outline" className="mt-3">
                                <Link href="/hpp">Buka Kalkulator HPP</Link>
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                        <DrawerFooter className="shrink-0 border-t">
                          <DrawerClose asChild>
                            <Button type="button" variant="outline">
                              Tutup
                            </Button>
                          </DrawerClose>
                        </DrawerFooter>
                      </DrawerContent>
                    </Drawer>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
