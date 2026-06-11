"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { CircleCheck, CircleDashed, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type UnitOption = {
  id: string;
  code: string;
  dimension: string;
};

type ItemOption = {
  id: string;
  name: string;
  itemType: "raw_material" | "packaging";
  defaultUnitId: string;
};

type CategoryOption = {
  id: string;
  name: string;
};

type MaterialRow = {
  id: string;
  itemId: string;
  unitId: string;
  qty: string;
  wastePercent: string;
  isOptional: boolean;
  mode: "existing" | "new";
  newMaterial: {
    name: string;
    sku: string;
    itemType: "raw_material" | "packaging";
    unitId: string;
    initialPrice: string;
  };
};

type CostRow = {
  id: string;
  name: string;
  componentType: "material" | "labor" | "overhead" | "other";
  basis: "per_batch" | "per_unit";
  amount: string;
};

type VariantDraft = {
  id: string;
  size: string;
  sku: string;
  barcode: string;
  hasInitialStock: boolean;
  stock: string;
  initialSellingPrice: string;
  recipeName: string;
  outputQty: string;
  outputUnitId: string;
  lossPercent: string;
};

type VariantPreview = {
  variantId: string;
  recipeId: string;
  size: string | null;
  recipeName: string;
  currentSellingPrice: number;
  hppPerUnit: number;
  materialCost: number;
  additionalCost: number;
  warnings: Array<{ message: string }>;
};

type HppPreview = {
  productId: string;
  variants: VariantPreview[];
};

const createMaterialRow = (defaultUnitId: string): MaterialRow => ({
  id: crypto.randomUUID(),
  itemId: "",
  unitId: defaultUnitId,
  qty: "",
  wastePercent: "0",
  isOptional: false,
  mode: "existing",
  newMaterial: {
    name: "",
    sku: "",
    itemType: "raw_material",
    unitId: defaultUnitId,
    initialPrice: "",
  },
});

const createCostRow = (): CostRow => ({
  id: crypto.randomUUID(),
  name: "",
  componentType: "overhead",
  basis: "per_batch",
  amount: "",
});

const createVariantDraft = (defaultUnitId: string): VariantDraft => ({
  id: crypto.randomUUID(),
  size: "",
  sku: "",
  barcode: "",
  hasInitialStock: false,
  stock: "0",
  initialSellingPrice: "",
  recipeName: "",
  outputQty: "",
  outputUnitId: defaultUnitId,
  lossPercent: "0",
});

const formatCurrency = (value: number) =>
  value.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

export function SetupOperasionalWizard({
  units,
  initialItems,
  categories,
}: {
  units: UnitOption[];
  initialItems: ItemOption[];
  categories: CategoryOption[];
}) {
  const defaultUnitId = units[0]?.id ?? "";
  const initialVariant = createVariantDraft(defaultUnitId);
  const [items, setItems] = useState<ItemOption[]>(initialItems);
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<HppPreview | null>(null);
  const [sellingPrices, setSellingPrices] = useState<Record<string, string>>({});
  const [savingPriceByVariantId, setSavingPriceByVariantId] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("data-utama");

  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [categoryId, setCategoryId] = useState("__none");
  const [variants, setVariants] = useState<VariantDraft[]>([initialVariant]);
  const [materialsByVariantId, setMaterialsByVariantId] = useState<Record<string, MaterialRow[]>>({
    [initialVariant.id]: [createMaterialRow(defaultUnitId)],
  });
  const [costs, setCosts] = useState<CostRow[]>([]);
  const hasValidInitialStockSetup = useCallback((variant: VariantDraft) => {
    if (!variant.hasInitialStock) {
      return true;
    }

    const stockValue = Number(variant.stock);
    const sellingPrice = Number(variant.initialSellingPrice);
    return (
      variant.stock.trim().length > 0 &&
      Number.isFinite(stockValue) &&
      stockValue > 0 &&
      variant.initialSellingPrice.trim().length > 0 &&
      Number.isFinite(sellingPrice) &&
      sellingPrice >= 0
    );
  }, []);

  const guide = useMemo(
    () => [
      {
        label: "Isi data produk",
        done: productName.trim().length > 0,
      },
      {
        label: "Isi data varian + resep (boleh banyak)",
        done: variants.some(
          (variant) =>
            Number(variant.outputQty) > 0 &&
            variant.recipeName.trim().length > 0 &&
            variant.outputUnitId.length > 0 &&
            hasValidInitialStockSetup(variant)
        ),
      },
      {
        label: "Tambahkan minimal 1 bahan BOM",
        done:
          variants.length > 0 &&
          variants.every((variant) =>
            (materialsByVariantId[variant.id] ?? []).some(
              (row) => row.itemId && row.unitId && Number(row.qty) > 0
            )
          ),
      },
      {
        label: "Submit lalu cek preview HPP",
        done: preview !== null,
      },
    ],
    [hasValidInitialStockSetup, materialsByVariantId, productName, preview, variants]
  );

  const getSellingPriceInput = (variant: VariantPreview) =>
    sellingPrices[variant.variantId] ?? String(variant.currentSellingPrice ?? 0);
  const updateVariant = (rowId: string, patch: Partial<VariantDraft>) => {
    setVariants((rows) => rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  };

  const addVariantRow = () => {
    const newVariant = createVariantDraft(defaultUnitId);
    setVariants((rows) => [...rows, newVariant]);
    setMaterialsByVariantId((prev) => ({
      ...prev,
      [newVariant.id]: [createMaterialRow(defaultUnitId)],
    }));
  };

  const removeVariantRow = (variantId: string) => {
    setVariants((rows) => rows.filter((item) => item.id !== variantId));
    setMaterialsByVariantId((prev) => {
      const next = { ...prev };
      delete next[variantId];
      return next;
    });
  };

  const updateMaterial = (variantId: string, rowId: string, patch: Partial<MaterialRow>) => {
    setMaterialsByVariantId((prev) => ({
      ...prev,
      [variantId]: (prev[variantId] ?? []).map((row) =>
        row.id === rowId ? { ...row, ...patch } : row
      ),
    }));
  };

  const addMaterialRow = (variantId: string) => {
    setMaterialsByVariantId((prev) => ({
      ...prev,
      [variantId]: [...(prev[variantId] ?? []), createMaterialRow(defaultUnitId)],
    }));
  };

  const removeMaterialRow = (variantId: string, rowId: string) => {
    setMaterialsByVariantId((prev) => ({
      ...prev,
      [variantId]: (prev[variantId] ?? []).filter((item) => item.id !== rowId),
    }));
  };

  const updateMaterialNewDraft = (
    variantId: string,
    rowId: string,
    patch: Partial<MaterialRow["newMaterial"]>
  ) => {
    setMaterialsByVariantId((prev) => ({
      ...prev,
      [variantId]: (prev[variantId] ?? []).map((row) =>
        row.id === rowId ? { ...row, newMaterial: { ...row.newMaterial, ...patch } } : row
      ),
    }));
  };

  const updateCost = (rowId: string, patch: Partial<CostRow>) => {
    setCosts((rows) => rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  };

  const createRawMaterial = async (payload: MaterialRow["newMaterial"]) => {
    const response = await fetch("/api/setup/raw-material", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name,
        sku: payload.sku,
        itemType: payload.itemType,
        unitId: payload.unitId,
        initialPrice: Number(payload.initialPrice || 0),
      }),
    });
    const json = (await response.json()) as {
      success: boolean;
      message?: string;
      data?: ItemOption;
    };
    if (!response.ok || !json.success || !json.data) {
      throw new Error(json.message ?? "Gagal menambahkan bahan");
    }
    return json.data;
  };

  const saveSellingPrice = async (variant: VariantPreview) => {
    const rawValue = getSellingPriceInput(variant).trim();
    const parsedPrice = Number(rawValue);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      toast.error("Harga jual tidak valid.");
      return;
    }

    setSavingPriceByVariantId((prev) => ({ ...prev, [variant.variantId]: true }));
    try {
      const response = await fetch("/api/setup/variant-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: variant.variantId,
          sellingPrice: parsedPrice,
        }),
      });
      const json = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !json.success) {
        throw new Error(json.message ?? "Gagal menyimpan harga jual");
      }

      setPreview((prev) =>
        prev
          ? {
            ...prev,
            variants: prev.variants.map((item) =>
              item.variantId === variant.variantId
                ? { ...item, currentSellingPrice: parsedPrice }
                : item
            ),
          }
          : prev
      );
      setSellingPrices((prev) => ({ ...prev, [variant.variantId]: String(parsedPrice) }));
      toast.success("Harga jual varian berhasil disimpan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan harga jual");
    } finally {
      setSavingPriceByVariantId((prev) => ({ ...prev, [variant.variantId]: false }));
    }
  };

  const submitSetup = async () => {
    setIsSaving(true);
    setPreview(null);
    try {
      const hasInvalidVariantPrice = variants.some((variant) => !hasValidInitialStockSetup(variant));
      if (hasInvalidVariantPrice) {
        throw new Error(
          "Jika varian punya stok awal, stok awal dan harga per varian wajib diisi."
        );
      }

      const validCosts = costs
        .filter((row) => row.name.trim().length > 0 && Number(row.amount) >= 0)
        .map((row) => ({
          name: row.name,
          componentType: row.componentType,
          basis: row.basis,
          amount: Number(row.amount),
        }));

      const materialsByVariant = Object.fromEntries(
        variants.map((variant) => {
          const validRows = (materialsByVariantId[variant.id] ?? [])
            .filter((row) => row.itemId && row.unitId && Number(row.qty) > 0)
            .map((row, index) => ({
              itemId: row.itemId,
              unitId: row.unitId,
              qty: Number(row.qty),
              wastePercent: Number(row.wastePercent || "0"),
              isOptional: row.isOptional,
              sortOrder: index,
            }));
          return [variant.id, validRows];
        })
      ) as Record<string, Array<{
        itemId: string;
        unitId: string;
        qty: number;
        wastePercent: number;
        isOptional: boolean;
        sortOrder: number;
      }>>;

      const missingBomVariant = variants.find(
        (variant) => (materialsByVariant[variant.id] ?? []).length === 0
      );
      if (missingBomVariant) {
        throw new Error("Setiap varian harus punya minimal 1 bahan BOM.");
      }

      const validVariants = variants
        .filter(
          (variant) =>
            variant.recipeName.trim().length > 0 &&
            variant.outputUnitId.length > 0 &&
            Number(variant.outputQty) > 0 &&
            hasValidInitialStockSetup(variant)
        )
        .map((variant) => ({
          hasInitialStock: variant.hasInitialStock,
          stock: variant.hasInitialStock ? Number(variant.stock || "0") : 0,
          initialSellingPrice: variant.hasInitialStock
            ? Number(variant.initialSellingPrice || "0")
            : undefined,
          size: variant.size,
          sku: variant.sku,
          barcode: variant.barcode,
          recipeName: variant.recipeName,
          outputQty: Number(variant.outputQty),
          outputUnitId: variant.outputUnitId,
          lossPercent: Number(variant.lossPercent || "0"),
          materials: materialsByVariant[variant.id] ?? [],
        }));

      const response = await fetch("/api/setup/operasional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          productDescription,
          categoryId: categoryId === "__none" ? null : categoryId,
          variants: validVariants,
          costs: validCosts,
        }),
      });
      const json = (await response.json()) as {
        success: boolean;
        message?: string;
        data?: HppPreview;
      };

      if (!response.ok || !json.success || !json.data) {
        throw new Error(json.message ?? "Gagal menyimpan setup");
      }
      setPreview(json.data);
      setSellingPrices(
        Object.fromEntries(
          json.data.variants.map((variant) => [
            variant.variantId,
            String(variant.currentSellingPrice ?? 0),
          ])
        )
      );
      toast.success("Setup selesai. Lanjut validasi HPP lalu post produksi.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Stok</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Setup Operasional</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <CardTitle>Setup Operasional 1 Layar</CardTitle>
          <CardDescription>
            Isi produk, varian, resep, bahan, biaya, lalu langsung dapat preview HPP tanpa pindah halaman.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {guide.map((step) => (
            <div key={step.label} className="flex items-center gap-2 text-sm">
              {step.done ? (
                <CircleCheck className="size-4 text-emerald-600" />
              ) : (
                <CircleDashed className="size-4 text-muted-foreground" />
              )}
              <span>{step.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 md:grid-cols-4">
              <TabsTrigger value="data-utama">Data Utama</TabsTrigger>
              <TabsTrigger value="bom">BOM</TabsTrigger>
              <TabsTrigger value="biaya">Biaya</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="data-utama" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">1) Produk</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="setup-product-name">Nama produk</FieldLabel>
                    <Input
                      id="setup-product-name"
                      placeholder="Contoh: Kopi Arabika"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="setup-product-category">Kategori</FieldLabel>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger id="setup-product-category" className="w-full">
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
                  </Field>
                  <Field className="md:col-span-2">
                    <FieldLabel htmlFor="setup-product-description">Deskripsi produk (opsional)</FieldLabel>
                    <Input
                      id="setup-product-description"
                      placeholder="Contoh: Blend house 70:30"
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                    />
                  </Field>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">2) Varian + resep</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {variants.map((variant, index) => (
                    <div key={variant.id} className="flex flex-col gap-3 rounded-md border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">Varian {index + 1}</p>
                        {variants.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeVariantRow(variant.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        ) : null}
                      </div>
                      <FieldGroup className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <Field>
                          <FieldLabel htmlFor={`variant-size-${variant.id}`}>Ukuran varian</FieldLabel>
                          <Input
                            id={`variant-size-${variant.id}`}
                            placeholder="Contoh: 250g"
                            value={variant.size}
                            onChange={(e) => updateVariant(variant.id, { size: e.target.value })}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={`variant-sku-${variant.id}`}>SKU varian</FieldLabel>
                          <Input
                            id={`variant-sku-${variant.id}`}
                            placeholder="Contoh: SKU-KOPI-250"
                            value={variant.sku}
                            onChange={(e) => updateVariant(variant.id, { sku: e.target.value })}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={`variant-barcode-${variant.id}`}>Barcode varian</FieldLabel>
                          <Input
                            id={`variant-barcode-${variant.id}`}
                            placeholder="Opsional"
                            value={variant.barcode}
                            onChange={(e) => updateVariant(variant.id, { barcode: e.target.value })}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={`variant-stock-toggle-${variant.id}`}>
                            Punya stok awal?
                          </FieldLabel>
                          <div className="flex min-h-10 items-center justify-between rounded-md border px-3">
                            <p className="text-xs text-muted-foreground">
                              Aktifkan jika varian ini sudah punya saldo awal.
                            </p>
                            <Switch
                              id={`variant-stock-toggle-${variant.id}`}
                              checked={variant.hasInitialStock}
                              onCheckedChange={(checked) =>
                                updateVariant(variant.id, {
                                  hasInitialStock: checked === true,
                                  stock: checked === true ? variant.stock : "0",
                                  initialSellingPrice:
                                    checked === true ? variant.initialSellingPrice : "",
                                })
                              }
                            />
                          </div>
                        </Field>
                        {variant.hasInitialStock ? (
                          <>
                            <Field>
                              <FieldLabel htmlFor={`variant-stock-${variant.id}`}>Stok awal</FieldLabel>
                              <Input
                                id={`variant-stock-${variant.id}`}
                                type="number"
                                min="0.0001"
                                step="1"
                                value={variant.stock}
                                onChange={(e) => updateVariant(variant.id, { stock: e.target.value })}
                                placeholder="Wajib diisi"
                              />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor={`variant-initial-selling-price-${variant.id}`}>
                                Harga per varian
                              </FieldLabel>
                              <Input
                                id={`variant-initial-selling-price-${variant.id}`}
                                type="number"
                                min="0"
                                step="100"
                                value={variant.initialSellingPrice}
                                onChange={(e) =>
                                  updateVariant(variant.id, { initialSellingPrice: e.target.value })
                                }
                                placeholder="Wajib diisi"
                              />
                            </Field>
                          </>
                        ) : null}
                        <Field>
                          <FieldLabel htmlFor={`variant-recipe-name-${variant.id}`}>Nama resep varian</FieldLabel>
                          <Input
                            id={`variant-recipe-name-${variant.id}`}
                            placeholder="Contoh: Resep Kopi 250g"
                            value={variant.recipeName}
                            onChange={(e) => updateVariant(variant.id, { recipeName: e.target.value })}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={`variant-output-qty-${variant.id}`}>Output per batch</FieldLabel>
                          <Input
                            id={`variant-output-qty-${variant.id}`}
                            type="number"
                            min="0.0001"
                            step="0.0001"
                            value={variant.outputQty}
                            onChange={(e) => updateVariant(variant.id, { outputQty: e.target.value })}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={`variant-output-unit-${variant.id}`}>Satuan output</FieldLabel>
                          <Select
                            value={variant.outputUnitId}
                            onValueChange={(value) => updateVariant(variant.id, { outputUnitId: value })}
                          >
                            <SelectTrigger id={`variant-output-unit-${variant.id}`} className="w-full">
                              <SelectValue placeholder="Pilih satuan output" />
                            </SelectTrigger>
                            <SelectContent>
                              {units.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id}>
                                  {unit.code} ({unit.dimension})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={`variant-loss-${variant.id}`}>Susut (%)</FieldLabel>
                          <Input
                            id={`variant-loss-${variant.id}`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={variant.lossPercent}
                            onChange={(e) => updateVariant(variant.id, { lossPercent: e.target.value })}
                          />
                        </Field>
                      </FieldGroup>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addVariantRow}
                  >
                    <Plus className="mr-2 size-4" />
                    Tambah varian
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bom">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">3) BOM (Bahan)</CardTitle>
                  <CardDescription>
                    Pilih bahan yang sudah terdaftar atau tambah bahan baru langsung dari baris BOM.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {variants.map((variant, variantIndex) => {
                    const variantMaterials = materialsByVariantId[variant.id] ?? [];
                    return (
                      <div key={variant.id} className="space-y-3 rounded-md border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">
                            Varian {variantIndex + 1} - {variant.size || "Tanpa ukuran"}
                          </p>
                          <p className="text-xs text-muted-foreground">{variant.recipeName || "Resep belum diisi"}</p>
                        </div>

                        {variantMaterials.map((row, index) => (
                          <div key={row.id} className="space-y-3 rounded-md border p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-medium">Bahan {index + 1}</p>
                              <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                                <Switch
                                  id={`bom-mode-toggle-${variant.id}-${row.id}`}
                                  checked={row.mode === "new"}
                                  onCheckedChange={(checked) =>
                                    updateMaterial(variant.id, row.id, {
                                      mode: checked === true ? "new" : "existing",
                                    })
                                  }
                                />
                                <p className="text-xs text-muted-foreground">
                                  {row.mode === "new" ? "Mode: Tambah baru" : "Mode: Pilih terdaftar"}
                                </p>
                              </div>
                            </div>

                            {row.mode === "existing" ? (
                              <FieldGroup className="grid grid-cols-1 gap-2 md:grid-cols-5">
                                <Field>
                                  <FieldLabel htmlFor={`bom-item-${variant.id}-${row.id}`}>Nama bahan</FieldLabel>
                                  <Select
                                    value={row.itemId}
                                    onValueChange={(value) => {
                                      const selected = items.find((item) => item.id === value);
                                      updateMaterial(variant.id, row.id, {
                                        itemId: value,
                                        unitId: selected?.defaultUnitId ?? row.unitId,
                                      });
                                    }}
                                  >
                                    <SelectTrigger id={`bom-item-${variant.id}-${row.id}`} className="w-full">
                                      <SelectValue placeholder={`Bahan ${index + 1}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {items.length === 0 ? (
                                        <SelectItem value="__empty" disabled>
                                          Belum ada bahan terdaftar
                                        </SelectItem>
                                      ) : (
                                        items.map((item) => (
                                          <SelectItem key={item.id} value={item.id}>
                                            {item.name}
                                          </SelectItem>
                                        ))
                                      )}
                                    </SelectContent>
                                  </Select>
                                </Field>
                                <Field>
                                  <FieldLabel htmlFor={`bom-unit-${variant.id}-${row.id}`}>Satuan</FieldLabel>
                                  <Select
                                    value={row.unitId}
                                    onValueChange={(value) =>
                                      updateMaterial(variant.id, row.id, { unitId: value })
                                    }
                                  >
                                    <SelectTrigger id={`bom-unit-${variant.id}-${row.id}`} className="w-full">
                                      <SelectValue placeholder="Satuan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {units.map((unit) => (
                                        <SelectItem key={unit.id} value={unit.id}>
                                          {unit.code}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </Field>
                                <Field>
                                  <FieldLabel htmlFor={`bom-qty-${variant.id}-${row.id}`}>Qty</FieldLabel>
                                  <Input
                                    id={`bom-qty-${variant.id}-${row.id}`}
                                    placeholder="Contoh: 1.25"
                                    type="number"
                                    step="0.0001"
                                    value={row.qty}
                                    onChange={(e) =>
                                      updateMaterial(variant.id, row.id, { qty: e.target.value })
                                    }
                                  />
                                </Field>
                                <Field>
                                  <FieldLabel htmlFor={`bom-waste-${variant.id}-${row.id}`}>Susut (%)</FieldLabel>
                                  <Input
                                    id={`bom-waste-${variant.id}-${row.id}`}
                                    placeholder="Contoh: 2"
                                    type="number"
                                    step="0.01"
                                    value={row.wastePercent}
                                    onChange={(e) =>
                                      updateMaterial(variant.id, row.id, { wastePercent: e.target.value })
                                    }
                                  />
                                </Field>
                                <Field>
                                  <FieldLabel htmlFor={`bom-optional-${variant.id}-${row.id}`}>Opsional</FieldLabel>
                                  <div className="h-9 px-3 py-1 flex items-center border rounded-md gap-2">
                                    <Checkbox
                                      id={`bom-optional-${variant.id}-${row.id}`}
                                      checked={row.isOptional}
                                      onCheckedChange={(checked) =>
                                        updateMaterial(variant.id, row.id, { isOptional: checked === true })
                                      }
                                    />
                                  </div>
                                </Field>
                                {variantMaterials.length > 1 ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => removeMaterialRow(variant.id, row.id)}
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                ) : null}
                              </FieldGroup>
                            ) : (
                              <FieldGroup className="grid grid-cols-1 gap-2 md:grid-cols-5">
                                <Field>
                                  <FieldLabel htmlFor={`new-bom-name-${variant.id}-${row.id}`}>
                                    Nama bahan baru
                                  </FieldLabel>
                                  <Input
                                    id={`new-bom-name-${variant.id}-${row.id}`}
                                    placeholder="Contoh: Gula pasir"
                                    value={row.newMaterial.name}
                                    onChange={(e) =>
                                      updateMaterialNewDraft(variant.id, row.id, { name: e.target.value })
                                    }
                                  />
                                </Field>
                                <Field>
                                  <FieldLabel htmlFor={`new-bom-sku-${variant.id}-${row.id}`}>
                                    SKU (opsional)
                                  </FieldLabel>
                                  <Input
                                    id={`new-bom-sku-${variant.id}-${row.id}`}
                                    placeholder="Contoh: BB-GULA-01"
                                    value={row.newMaterial.sku}
                                    onChange={(e) =>
                                      updateMaterialNewDraft(variant.id, row.id, { sku: e.target.value })
                                    }
                                  />
                                </Field>
                                <Field>
                                  <FieldLabel htmlFor={`new-bom-type-${variant.id}-${row.id}`}>Jenis bahan</FieldLabel>
                                  <Select
                                    value={row.newMaterial.itemType}
                                    onValueChange={(value) =>
                                      updateMaterialNewDraft(variant.id, row.id, {
                                        itemType: value as "raw_material" | "packaging",
                                      })
                                    }
                                  >
                                    <SelectTrigger id={`new-bom-type-${variant.id}-${row.id}`} className="w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="raw_material">Bahan utama</SelectItem>
                                      <SelectItem value="packaging">Kemasan</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </Field>
                                <Field>
                                  <FieldLabel htmlFor={`new-bom-unit-${variant.id}-${row.id}`}>Satuan</FieldLabel>
                                  <Select
                                    value={row.newMaterial.unitId}
                                    onValueChange={(value) =>
                                      updateMaterialNewDraft(variant.id, row.id, { unitId: value })
                                    }
                                  >
                                    <SelectTrigger id={`new-bom-unit-${variant.id}-${row.id}`} className="w-full">
                                      <SelectValue placeholder="Satuan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {units.map((unit) => (
                                        <SelectItem key={unit.id} value={unit.id}>
                                          {unit.code}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </Field>
                                <Field>
                                  <FieldLabel htmlFor={`new-bom-price-${variant.id}-${row.id}`}>
                                    Harga awal (opsional)
                                  </FieldLabel>
                                  <Input
                                    id={`new-bom-price-${variant.id}-${row.id}`}
                                    placeholder="Contoh: 15000"
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={row.newMaterial.initialPrice}
                                    onChange={(e) =>
                                      updateMaterialNewDraft(variant.id, row.id, { initialPrice: e.target.value })
                                    }
                                  />
                                </Field>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={async () => {
                                    try {
                                      const created = await createRawMaterial(row.newMaterial);
                                      setItems((prev) => [...prev, created]);
                                      updateMaterial(variant.id, row.id, {
                                        mode: "existing",
                                        itemId: created.id,
                                        unitId: created.defaultUnitId || row.unitId,
                                      });
                                      updateMaterialNewDraft(variant.id, row.id, {
                                        name: "",
                                        sku: "",
                                        itemType: "raw_material",
                                        unitId: created.defaultUnitId || row.newMaterial.unitId,
                                        initialPrice: "",
                                      });
                                      toast.success("Bahan baru berhasil ditambahkan dan dipilih.");
                                    } catch (error) {
                                      toast.error(
                                        error instanceof Error
                                          ? error.message
                                          : "Gagal menambahkan bahan baru"
                                      );
                                    }
                                  }}
                                  disabled={!row.newMaterial.name || !row.newMaterial.unitId}
                                >
                                  Simpan bahan baru
                                </Button>
                              </FieldGroup>
                            )}
                          </div>
                        ))}

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => addMaterialRow(variant.id)}
                          >
                            <Plus className="mr-2 size-4" />
                            Tambah baris bahan
                          </Button>
                          {items.length === 0 ? (
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() =>
                                setMaterialsByVariantId((prev) => ({
                                  ...prev,
                                  [variant.id]: (prev[variant.id] ?? []).map((item, idx) =>
                                    idx === 0 ? { ...item, mode: "new" } : item
                                  ),
                                }))
                              }
                            >
                              <Plus className="mr-2 size-4" />
                              Mulai dengan bahan baru
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="biaya">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">4) Biaya tambahan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {costs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada biaya tambahan.</p>
                  ) : null}
                  {costs.map((row) => (
                    <div key={row.id} className="grid gap-2 rounded-md border p-3 md:grid-cols-5">
                      <Field>
                        <FieldLabel htmlFor={`cost-name-${row.id}`}>Nama biaya</FieldLabel>
                        <Input
                          id={`cost-name-${row.id}`}
                          placeholder="Contoh: Listrik produksi"
                          value={row.name}
                          onChange={(e) => updateCost(row.id, { name: e.target.value })}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor={`cost-type-${row.id}`}>Jenis biaya</FieldLabel>
                        <Select
                          value={row.componentType}
                          onValueChange={(value) =>
                            updateCost(row.id, { componentType: value as CostRow["componentType"] })
                          }
                        >
                          <SelectTrigger id={`cost-type-${row.id}`} className="w-full">
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
                        <FieldLabel htmlFor={`cost-basis-${row.id}`}>Perhitungan</FieldLabel>
                        <Select
                          value={row.basis}
                          onValueChange={(value) => updateCost(row.id, { basis: value as CostRow["basis"] })}
                        >
                          <SelectTrigger id={`cost-basis-${row.id}`} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="per_batch">Per batch</SelectItem>
                            <SelectItem value="per_unit">Per unit</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor={`cost-amount-${row.id}`}>Nominal</FieldLabel>
                        <Input
                          id={`cost-amount-${row.id}`}
                          placeholder="Contoh: 50000"
                          type="number"
                          step="100"
                          value={row.amount}
                          onChange={(e) => updateCost(row.id, { amount: e.target.value })}
                        />
                      </Field>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setCosts((rows) => rows.filter((item) => item.id !== row.id))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCosts((rows) => [...rows, createCostRow()])}
                  >
                    <Plus className="mr-2 size-4" />
                    Tambah biaya
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Preview HPP</CardTitle>
                  <CardDescription>
                    Cek hasil HPP per varian. Jika belum ada, klik simpan setup dulu.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {!preview ? (
                    <p className="text-muted-foreground">
                      Belum ada preview. Simpan setup terlebih dahulu.
                    </p>
                  ) : (
                    <>
                      {preview.variants.map((variant) => (
                        <div key={variant.recipeId} className="rounded-md border p-2">
                          <p className="font-medium">
                            {variant.size ? `Varian ${variant.size}` : "Varian tanpa ukuran"}
                          </p>
                          <p className="text-xs text-muted-foreground">{variant.recipeName}</p>
                          <p className="text-xs">Recipe ID: {variant.recipeId}</p>
                          <p className="text-xs">Biaya bahan: {formatCurrency(variant.materialCost)}</p>
                          <p className="text-xs">Biaya tambahan: {formatCurrency(variant.additionalCost)}</p>
                          <p className="text-sm font-semibold text-primary">
                            HPP per unit: {formatCurrency(variant.hppPerUnit)}
                          </p>
                          <div className="mt-2 flex flex-col gap-2 rounded-md border p-2">
                            <p className="text-xs font-medium">Tentukan harga jual varian</p>
                            <div className="flex flex-col gap-2 md:flex-row">
                              <Field className="w-full">
                                <FieldLabel htmlFor={`preview-selling-price-${variant.variantId}`}>
                                  Harga jual
                                </FieldLabel>
                                <Input
                                  id={`preview-selling-price-${variant.variantId}`}
                                  type="number"
                                  min="0"
                                  step="100"
                                  value={getSellingPriceInput(variant)}
                                  onChange={(event) =>
                                    setSellingPrices((prev) => ({
                                      ...prev,
                                      [variant.variantId]: event.target.value,
                                    }))
                                  }
                                  placeholder="Contoh: 25000"
                                />
                              </Field>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => void saveSellingPrice(variant)}
                                disabled={savingPriceByVariantId[variant.variantId] === true}
                              >
                                {savingPriceByVariantId[variant.variantId] === true
                                  ? "Menyimpan..."
                                  : "Simpan harga jual"}
                              </Button>
                            </div>
                            {Number(getSellingPriceInput(variant)) > 0 ? (
                              <p className="text-xs text-muted-foreground">
                                Margin kotor:{" "}
                                {formatCurrency(
                                  Number(getSellingPriceInput(variant)) - variant.hppPerUnit
                                )}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                Isi harga jual untuk lihat margin kotor.
                              </p>
                            )}
                          </div>
                          {variant.warnings.length > 0 ? (
                            <div className="mt-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                              {variant.warnings.map((warning, index) => (
                                <p key={`${warning.message}-${index}`}>- {warning.message}</p>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aksi cepat</CardTitle>
              <CardDescription>Simpan setup dan lanjut ke langkah berikutnya.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" onClick={submitSetup} disabled={isSaving}>
                {isSaving ? "Menyimpan..." : "Simpan setup operasional"}
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/produksi">Buka Post Produksi</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/hpp">Buka Kalkulator HPP</Link>
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setActiveTab("preview")}
              >
                Buka tab preview
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

