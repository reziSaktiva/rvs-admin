import Link from "next/link";
import { PencilIcon, TrashIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Field, FieldDescription as FormFieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  addRecipeCostAction,
  addRecipeMaterialAction,
  deleteRecipeCostAction,
  deleteRecipeMaterialAction,
  updateRecipeCoreAction,
  updateRecipeCostAction,
  updateRecipeMaterialAction,
  updateRecipeStatusAction,
} from "../../actions";
import type { RecipeRow, ResepProduksiPageData } from "../../data";
import {
  costBasisLabel,
  costTypeLabel,
  formatCurrency,
  itemTypeLabel,
  statusLabel,
  type RecipeStatus,
} from "../view-model";

type ManageRecipeDrawerProps = {
  recipe: RecipeRow;
  selectedStatus?: RecipeStatus;
  availableItems: ResepProduksiPageData["availableItems"];
  availableUnits: ResepProduksiPageData["availableUnits"];
};

export function ManageRecipeDrawer({
  recipe,
  selectedStatus,
  availableItems,
  availableUnits,
}: ManageRecipeDrawerProps) {
  const outputQty = Number(recipe.outputQty);
  const safeOutputQty = Number.isFinite(outputQty) && outputQty > 0 ? outputQty : 0;
  const perBatchAdditionalCost = recipe.costs.reduce((total, item) => {
    if (item.basis !== "per_batch") return total;
    return total + Number(item.amount);
  }, 0);
  const perUnitAdditionalCost = recipe.costs.reduce((total, item) => {
    if (item.basis !== "per_unit") return total;
    return total + Number(item.amount);
  }, 0);
  const estimatedAdditionalCostPerBatch =
    perBatchAdditionalCost + perUnitAdditionalCost * safeOutputQty;
  const materialCostRows = recipe.materials.map((item) => {
    const latestPriceInSameUnit =
      item.item.prices.find((price) => price.unitId === item.unit.id) ?? null;
    const latestAnyPrice = item.item.prices[0] ?? null;
    const appliedPrice = latestPriceInSameUnit ?? latestAnyPrice;
    const wastePercent = Number(item.wastePercent ?? 0);
    const baseQty = Number(item.qty);
    const adjustedQty = baseQty * (1 + wastePercent / 100);
    const unitPrice = appliedPrice ? Number(appliedPrice.pricePerUnit) : 0;
    const hasSameUnitPrice = !!latestPriceInSameUnit;
    const estimatedCost = hasSameUnitPrice ? adjustedQty * unitPrice : 0;

    return {
      id: item.id,
      name: item.item.name,
      baseQty,
      adjustedQty,
      unitCode: item.unit.code,
      wastePercent,
      hasSameUnitPrice,
      estimatedCost,
      priceLabel: appliedPrice ? formatCurrency(unitPrice) : null,
      priceUnitCode: appliedPrice?.unit.code ?? null,
    };
  });
  const estimatedMaterialCostPerBatch = materialCostRows.reduce((total, item) => total + item.estimatedCost, 0);
  const pricedMaterialCount = materialCostRows.filter((item) => item.hasSameUnitPrice).length;
  const unpricedMaterialCount = materialCostRows.length - pricedMaterialCount;
  const estimatedTotalCostPerBatch = estimatedMaterialCostPerBatch + estimatedAdditionalCostPerBatch;
  const estimatedTotalCostPerUnit =
    safeOutputQty > 0 ? estimatedTotalCostPerBatch / safeOutputQty : 0;
  const variantSellingPrice = Number(recipe.productVariant.price ?? 0);
  const estimatedMarginFromAdditionalCost =
    variantSellingPrice > 0 ? variantSellingPrice - estimatedTotalCostPerUnit : null;

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          Kelola resep
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-dvh max-h-dvh overflow-hidden bg-background data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-5xl">
        <DrawerHeader className="shrink-0 border-b bg-muted/20 px-4 py-4 md:px-6">
          <DrawerTitle className="text-lg">Kelola resep: {recipe.name}</DrawerTitle>
          <DrawerDescription>
            Ubah nama resep, hasil batch, status, bahan, biaya tambahan, dan cek ringkasan HPP.
          </DrawerDescription>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs uppercase text-muted-foreground">Produk</p>
              <p className="mt-1 font-medium">{recipe.productVariant.product.name}</p>
              <p className="text-xs text-muted-foreground">SKU: {recipe.productVariant.sku ?? "-"}</p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs uppercase text-muted-foreground">Hasil & susut</p>
              <p className="mt-1 font-medium">
                {Number(recipe.outputQty).toLocaleString("id-ID")} {recipe.outputUnit.code}
              </p>
              <p className="text-xs text-muted-foreground">
                Susut: {Number(recipe.lossPercent ?? 0).toLocaleString("id-ID")}%
              </p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs uppercase text-muted-foreground">Status</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={recipe.status === "active" ? "default" : "secondary"}>
                  {statusLabel(recipe.status)}
                </Badge>
                <form action={updateRecipeStatusAction} className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
                  <input type="hidden" name="recipeId" value={recipe.id} />
                  <Select name="status" defaultValue={recipe.status}>
                    <SelectTrigger className="h-8 w-full text-xs sm:w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draf</SelectItem>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="archived">Diarsipkan</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit" size="sm" variant="outline" className="w-full sm:w-auto">
                    Simpan status
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </DrawerHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-base">Informasi resep</CardTitle>
              <CardDescription>
                Nama resep dan parameter hasil batch sebaiknya diisi dulu sebelum mengubah BOM.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <form action={updateRecipeCoreAction} className="space-y-4">
                <input type="hidden" name="recipeId" value={recipe.id} />
                <input type="hidden" name="statusFilter" value={selectedStatus ?? ""} />
                <Field>
                  <FieldLabel htmlFor={`recipe-name-${recipe.id}`}>Nama resep</FieldLabel>
                  <Input id={`recipe-name-${recipe.id}`} name="name" defaultValue={recipe.name} required />
                </Field>
                <FieldGroup className="grid grid-cols-1 gap-3 md:grid-cols-4">
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
                <Button type="submit" size="sm" className="w-full sm:w-auto">
                  Simpan informasi resep
                </Button>
              </form>
            </CardContent>
          </Card>
          <div className="flex flex-col gap-4">
            <Card className="overflow-hidden border shadow-sm">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-base">Daftar bahan (BOM)</CardTitle>
                <CardDescription>
                  Atur bahan utama resep, susut, dan urutan proses agar biaya produksi lebih akurat.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bahan</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Susut (%)</TableHead>
                        <TableHead className="w-[180px]">Aksi</TableHead>
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
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button type="button" size="sm" variant="secondary" className="w-full sm:flex-1">
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
                                <form action={deleteRecipeMaterialAction} className="w-full sm:flex-1">
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
                </div>

                <form action={addRecipeMaterialAction} className="rounded-lg border border-dashed bg-muted/10 p-3 md:p-4">
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
                  <Button type="submit" size="sm" className="mt-3 w-full sm:w-auto">
                    Tambah
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border shadow-sm">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-base">Biaya tambahan</CardTitle>
                <CardDescription>
                  Catat biaya tenaga kerja, overhead, atau biaya lain di luar bahan baku.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Komponen</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Dasar hitung</TableHead>
                        <TableHead>Nominal</TableHead>
                        <TableHead className="w-[180px]">Aksi</TableHead>
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
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button type="button" size="sm" variant="secondary" className="w-full sm:flex-1">
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
                                <form action={deleteRecipeCostAction} className="w-full sm:flex-1">
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
                </div>

                <form action={addRecipeCostAction} className="grid grid-cols-1 gap-2 rounded-lg border border-dashed bg-muted/10 p-3 md:grid-cols-5 md:p-4">
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
                  <Button type="submit" size="sm" className="w-full md:w-auto">
                    Tambah
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-base">Ringkasan HPP resep</CardTitle>
              <CardDescription>
                Ringkasan cepat agar tim produksi tahu gambaran biaya sebelum masuk kalkulator HPP.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Gambaran bahan baku per batch</p>
                  <p className="text-xs text-muted-foreground">
                    {pricedMaterialCount}/{materialCostRows.length} bahan punya harga satuan yang cocok
                  </p>
                </div>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bahan</TableHead>
                        <TableHead>Kebutuhan bersih</TableHead>
                        <TableHead>Kebutuhan + susut</TableHead>
                        <TableHead>Harga acuan</TableHead>
                        <TableHead className="text-right">Estimasi biaya</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialCostRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Belum ada bahan baku di resep ini.
                          </TableCell>
                        </TableRow>
                      ) : (
                        materialCostRows.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                              {item.baseQty.toLocaleString("id-ID")} {item.unitCode}
                            </TableCell>
                            <TableCell>
                              {item.adjustedQty.toLocaleString("id-ID", {
                                maximumFractionDigits: 4,
                              })}{" "}
                              {item.unitCode}
                              {item.wastePercent > 0 ? (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  (+{item.wastePercent.toLocaleString("id-ID")}%)
                                </span>
                              ) : null}
                            </TableCell>
                            <TableCell>
                              {item.priceLabel ? (
                                <span>
                                  {item.priceLabel} / {item.priceUnitCode}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Belum ada harga</span>
                              )}
                              {!item.hasSameUnitPrice && item.priceLabel ? (
                                <p className="text-xs text-amber-600 dark:text-amber-500">
                                  Unit harga berbeda, belum dihitung ke estimasi.
                                </p>
                              ) : null}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {item.hasSameUnitPrice ? (
                                formatCurrency(item.estimatedCost)
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Output per batch</p>
                  <p className="mt-1 text-sm font-semibold">
                    {safeOutputQty.toLocaleString("id-ID")} {recipe.outputUnit.code}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Estimasi biaya bahan per batch</p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatCurrency(estimatedMaterialCostPerBatch)}
                  </p>
                  {unpricedMaterialCount > 0 ? (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                      {unpricedMaterialCount} bahan belum terhitung karena harga/unit belum cocok.
                    </p>
                  ) : null}
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Estimasi biaya tambahan per batch</p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatCurrency(estimatedAdditionalCostPerBatch)}
                  </p>
                </div>
                <div className="rounded-md border bg-primary/5 p-3 sm:col-span-3">
                  <p className="text-xs text-muted-foreground">Estimasi total biaya per unit hasil</p>
                  <p className="mt-1 text-base font-semibold text-primary">
                    {formatCurrency(estimatedTotalCostPerUnit)}
                  </p>
                </div>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Cara hitung ringkasan ini
                </p>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>
                    1) Biaya tambahan per batch:{" "}
                    <span className="font-medium text-foreground">
                      {formatCurrency(perBatchAdditionalCost)}
                    </span>
                  </p>
                  <p>
                    2) Biaya tambahan per unit:{" "}
                    <span className="font-medium text-foreground">
                      {formatCurrency(perUnitAdditionalCost)}
                    </span>{" "}
                    x {safeOutputQty.toLocaleString("id-ID")} {recipe.outputUnit.code}
                  </p>
                  <p>
                    3) Total biaya tambahan per batch:{" "}
                    <span className="font-medium text-foreground">
                      {formatCurrency(estimatedAdditionalCostPerBatch)}
                    </span>
                  </p>
                  <p>
                    4) Total biaya per batch = biaya bahan + biaya tambahan:{" "}
                    <span className="font-medium text-foreground">
                      {formatCurrency(estimatedTotalCostPerBatch)}
                    </span>
                  </p>
                  <p>
                    5) Dibagi output batch untuk dapat estimasi biaya per unit:{" "}
                    <span className="font-medium text-foreground">
                      {formatCurrency(estimatedTotalCostPerUnit)}
                    </span>
                  </p>
                </div>
              </div>
              <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p>
                  Ringkasan ini adalah estimasi cepat berdasarkan data resep saat ini. Untuk HPP final
                  paling akurat (termasuk fallback harga & validasi data), gunakan kalkulator HPP.
                </p>
                {estimatedMarginFromAdditionalCost !== null ? (
                  <p className="mt-2">
                    Dengan harga jual varian{" "}
                    <span className="font-medium text-foreground">
                      {formatCurrency(variantSellingPrice)}
                    </span>{" "}
                    per unit, sisa margin estimasi sekitar{" "}
                    <span className="font-medium text-foreground">
                      {formatCurrency(estimatedMarginFromAdditionalCost)}
                    </span>
                    .
                  </p>
                ) : null}
              </div>
              <Button asChild size="sm" variant="outline" className="mt-3">
                <Link href="/hpp">Buka Kalkulator HPP</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <DrawerFooter className="shrink-0 border-t bg-muted/10 px-4 py-3 md:px-6">
          <DrawerClose asChild>
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              Tutup
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
