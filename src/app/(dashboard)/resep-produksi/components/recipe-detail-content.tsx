"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PencilIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
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
} from "../actions";
import type { RecipeRow, ResepProduksiPageData } from "../data";
import {
  costBasisLabel,
  costTypeLabel,
  formatCurrency,
  itemTypeLabel,
  statusLabel,
} from "./view-model";

type RecipeDetailContentProps = {
  recipe: RecipeRow;
  availableItems: ResepProduksiPageData["availableItems"];
  availableUnits: ResepProduksiPageData["availableUnits"];
  detailPath: string;
  canManage: boolean;
  readOnlyMessage: string | null;
  successMessage?: string | null;
  errorMessage?: string | null;
};

export function RecipeDetailContent({
  recipe,
  availableItems,
  availableUnits,
  detailPath,
  canManage,
  readOnlyMessage,
  successMessage,
  errorMessage,
}: RecipeDetailContentProps) {
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
    }
    if (errorMessage) {
      toast.error(errorMessage);
    }

    if (!successMessage && !errorMessage) return;

    const url = new URL(window.location.href);
    url.searchParams.delete("success");
    url.searchParams.delete("error");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [successMessage, errorMessage]);

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
  const estimatedAdditionalCostPerBatch = perBatchAdditionalCost + perUnitAdditionalCost * safeOutputQty;
  const materialCostRows = recipe.materials.map((item) => {
    const latestPriceInSameUnit = item.item.prices.find((price) => price.unitId === item.unit.id) ?? null;
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
  const estimatedTotalCostPerUnit = safeOutputQty > 0 ? estimatedTotalCostPerBatch / safeOutputQty : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/resep-produksi">Resep produksi</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{recipe.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-start justify-between w-full">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Kelola resep: {recipe.name}</h1>
            <p className="text-sm text-muted-foreground">
              Atur informasi resep, BOM, biaya tambahan, dan cek ringkasan HPP.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/resep-produksi">Kembali ke daftar resep</Link>
          </Button>
        </div>
      </div>

      {readOnlyMessage ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          {readOnlyMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informasi resep</CardTitle>
              <CardDescription>Nama resep, hasil batch, satuan hasil, dan susut produksi.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateRecipeCoreAction} className="space-y-4">
                <input type="hidden" name="recipeId" value={recipe.id} />
                <input type="hidden" name="redirectTo" value={detailPath} />
                <Field>
                  <FieldLabel htmlFor={`recipe-name-${recipe.id}`}>Nama resep</FieldLabel>
                  <Input id={`recipe-name-${recipe.id}`} name="name" defaultValue={recipe.name} required disabled={!canManage} />
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
                      disabled={!canManage}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`recipe-output-unit-${recipe.id}`}>Satuan hasil</FieldLabel>
                    <Select name="outputUnitId" defaultValue={recipe.outputUnit.id} required disabled={!canManage}>
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
                      disabled={!canManage}
                    />
                  </Field>
                </FieldGroup>
                <Field className="max-w-[220px]">
                  <FieldLabel htmlFor={`recipe-status-${recipe.id}`}>Status</FieldLabel>
                  <Select name="status" defaultValue={recipe.status} disabled={!canManage}>
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
                <Button type="submit" disabled={!canManage}>
                  Simpan informasi resep
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daftar bahan (BOM)</CardTitle>
              <CardDescription>Atur kebutuhan bahan, susut, urutan proses, dan opsi material.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                          <TableCell>{Number(item.wastePercent ?? 0).toLocaleString("id-ID")}%</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button type="button" size="sm" variant="secondary" className="w-full sm:flex-1" disabled={!canManage}>
                                    Edit <PencilIcon />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Edit bahan resep</DialogTitle>
                                    <DialogDescription>Ubah jumlah, susut, urutan, dan status opsional bahan.</DialogDescription>
                                  </DialogHeader>
                                  <form action={updateRecipeMaterialAction} className="space-y-3">
                                    <input type="hidden" name="materialId" value={item.id} />
                                    <input type="hidden" name="redirectTo" value={detailPath} />
                                    <Field>
                                      <FieldLabel htmlFor={`edit-mat-qty-${item.id}`}>Jumlah</FieldLabel>
                                      <Input id={`edit-mat-qty-${item.id}`} name="qty" type="number" step="0.0001" defaultValue={String(item.qty)} required />
                                    </Field>
                                    <Field>
                                      <FieldLabel htmlFor={`edit-mat-waste-${item.id}`}>Susut (%)</FieldLabel>
                                      <Input id={`edit-mat-waste-${item.id}`} name="wastePercent" type="number" step="0.01" defaultValue={String(item.wastePercent ?? 0)} />
                                    </Field>
                                    <Field>
                                      <FieldLabel htmlFor={`edit-mat-order-${item.id}`}>Urutan</FieldLabel>
                                      <Input id={`edit-mat-order-${item.id}`} name="sortOrder" type="number" step="1" defaultValue={String(item.sortOrder ?? 0)} />
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
                                <input type="hidden" name="redirectTo" value={detailPath} />
                                <Button type="submit" size="sm" variant="destructive" className="w-full" disabled={!canManage}>
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

              {canManage ? (
                <form action={addRecipeMaterialAction} className="rounded-lg border border-dashed bg-muted/10 p-3 md:p-4">
                  <input type="hidden" name="recipeId" value={recipe.id} />
                  <input type="hidden" name="redirectTo" value={detailPath} />
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
                    <Input name="qty" type="number" step="0.0001" placeholder="Jumlah" required />
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
                    <Input name="wastePercent" type="number" step="0.01" placeholder="Susut %" />
                    <Input name="sortOrder" type="number" step="1" placeholder="Urutan" />
                    <Field className="flex items-center gap-2">
                      <Checkbox id={`new-material-optional-${recipe.id}`} name="isOptional" />
                      <FieldLabel htmlFor={`new-material-optional-${recipe.id}`} className="text-xs">
                        Opsional
                      </FieldLabel>
                    </Field>
                  </FieldGroup>
                  <FieldDescription className="mt-2">Isi kebutuhan bahan untuk 1 batch resep ini.</FieldDescription>
                  <Button type="submit" size="sm" className="mt-3">
                    Tambah material
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Biaya tambahan</CardTitle>
              <CardDescription>Biaya tenaga kerja, overhead, atau biaya lain di luar bahan baku.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                                  <Button type="button" size="sm" variant="secondary" className="w-full sm:flex-1" disabled={!canManage}>
                                    Edit <PencilIcon />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Edit biaya tambahan</DialogTitle>
                                    <DialogDescription>Ubah nama biaya, jenis, basis, dan nominal.</DialogDescription>
                                  </DialogHeader>
                                  <form action={updateRecipeCostAction} className="space-y-3">
                                    <input type="hidden" name="costId" value={item.id} />
                                    <input type="hidden" name="redirectTo" value={detailPath} />
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
                                      <Input id={`edit-cost-amount-${item.id}`} name="amount" type="number" step="100" defaultValue={String(item.amount)} required />
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
                                <input type="hidden" name="redirectTo" value={detailPath} />
                                <Button type="submit" size="sm" variant="destructive" className="w-full" disabled={!canManage}>
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

              {canManage ? (
                <form action={addRecipeCostAction} className="grid grid-cols-1 gap-2 rounded-lg border border-dashed bg-muted/10 p-3 md:grid-cols-5 md:p-4">
                  <input type="hidden" name="recipeId" value={recipe.id} />
                  <input type="hidden" name="redirectTo" value={detailPath} />
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
                    Tambah biaya
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ringkas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">Produk</p>
              <p className="font-medium">{recipe.productVariant.product.name}</p>
              <p className="text-muted-foreground">SKU: {recipe.productVariant.sku ?? "-"}</p>
              <div className="pt-2">
                <Badge variant={recipe.status === "active" ? "default" : "secondary"}>
                  {statusLabel(recipe.status)}
                </Badge>
              </div>
              <form action={updateRecipeStatusAction} className="space-y-2 pt-3">
                <input type="hidden" name="recipeId" value={recipe.id} />
                <input type="hidden" name="redirectTo" value={detailPath} />
                <Select name="status" defaultValue={recipe.status} disabled={!canManage}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draf</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="archived">Diarsipkan</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" size="sm" className="w-full" variant="outline" disabled={!canManage}>
                  Simpan status
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ringkasan HPP resep</CardTitle>
              <CardDescription>Estimasi cepat sebelum cek kalkulator HPP.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Output per batch</p>
                <p className="mt-1 text-sm font-semibold">
                  {safeOutputQty.toLocaleString("id-ID")} {recipe.outputUnit.code}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Bahan terhitung</p>
                <p className="mt-1 text-sm font-semibold">
                  {pricedMaterialCount}/{materialCostRows.length} bahan
                </p>
                {unpricedMaterialCount > 0 ? (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                    {unpricedMaterialCount} bahan belum terhitung karena unit harga belum cocok.
                  </p>
                ) : null}
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Estimasi biaya bahan per batch</p>
                <p className="mt-1 text-sm font-semibold">{formatCurrency(estimatedMaterialCostPerBatch)}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Estimasi biaya tambahan per batch</p>
                <p className="mt-1 text-sm font-semibold">{formatCurrency(estimatedAdditionalCostPerBatch)}</p>
              </div>
              <div className="rounded-md border bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">Estimasi total biaya per unit hasil</p>
                <p className="mt-1 text-base font-semibold text-primary">{formatCurrency(estimatedTotalCostPerUnit)}</p>
              </div>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/hpp">Buka Kalkulator HPP</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
