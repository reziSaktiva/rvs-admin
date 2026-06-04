"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CircleCheck, CircleDashed, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  price: string;
  stock: string;
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
  price: "",
  stock: "0",
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
  const [items, setItems] = useState<ItemOption[]>(initialItems);
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<HppPreview | null>(null);
  const [activeTab, setActiveTab] = useState("data-utama");

  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [categoryId, setCategoryId] = useState("__none");
  const [variants, setVariants] = useState<VariantDraft[]>([createVariantDraft(units[0]?.id ?? "")]);

  const [materials, setMaterials] = useState<MaterialRow[]>([createMaterialRow(units[0]?.id ?? "")]);
  const [costs, setCosts] = useState<CostRow[]>([]);

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
            variant.price.trim().length > 0 &&
            Number(variant.outputQty) > 0 &&
            variant.recipeName.trim().length > 0 &&
            variant.outputUnitId.length > 0
        ),
      },
      {
        label: "Tambahkan minimal 1 bahan BOM",
        done: materials.some((row) => row.itemId && row.unitId && Number(row.qty) > 0),
      },
      {
        label: "Submit lalu cek preview HPP",
        done: preview !== null,
      },
    ],
    [productName, preview, materials, variants]
  );
  const updateVariant = (rowId: string, patch: Partial<VariantDraft>) => {
    setVariants((rows) => rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  };

  const updateMaterial = (rowId: string, patch: Partial<MaterialRow>) => {
    setMaterials((rows) => rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  };

  const updateMaterialNewDraft = (
    rowId: string,
    patch: Partial<MaterialRow["newMaterial"]>
  ) => {
    setMaterials((rows) =>
      rows.map((row) =>
        row.id === rowId ? { ...row, newMaterial: { ...row.newMaterial, ...patch } } : row
      )
    );
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

  const submitSetup = async () => {
    setIsSaving(true);
    setPreview(null);
    try {
      const validMaterials = materials
        .filter((row) => row.itemId && row.unitId && Number(row.qty) > 0)
        .map((row, index) => ({
          itemId: row.itemId,
          unitId: row.unitId,
          qty: Number(row.qty),
          wastePercent: Number(row.wastePercent || "0"),
          isOptional: row.isOptional,
          sortOrder: index,
        }));

      const validCosts = costs
        .filter((row) => row.name.trim().length > 0 && Number(row.amount) >= 0)
        .map((row) => ({
          name: row.name,
          componentType: row.componentType,
          basis: row.basis,
          amount: Number(row.amount),
        }));

      const validVariants = variants
        .filter(
          (variant) =>
            variant.recipeName.trim().length > 0 &&
            variant.outputUnitId.length > 0 &&
            Number(variant.outputQty) > 0
        )
        .map((variant) => ({
          size: variant.size,
          sku: variant.sku,
          barcode: variant.barcode,
          price: Number(variant.price),
          stock: Number(variant.stock || "0"),
          recipeName: variant.recipeName,
          outputQty: Number(variant.outputQty),
          outputUnitId: variant.outputUnitId,
          lossPercent: Number(variant.lossPercent || "0"),
        }));

      const response = await fetch("/api/setup/operasional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          productDescription,
          categoryId: categoryId === "__none" ? null : categoryId,
          variants: validVariants,
          materials: validMaterials,
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
                  <Input
                    placeholder="Nama produk"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                  <Select value={categoryId} onValueChange={setCategoryId}>
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
                  <Input
                    placeholder="Deskripsi produk (opsional)"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    className="md:col-span-2"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">2) Varian + resep</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {variants.map((variant, index) => (
                    <div key={variant.id} className="grid gap-2 rounded-md border p-3 md:grid-cols-3">
                      <Input
                        placeholder={`Ukuran varian ${index + 1}`}
                        value={variant.size}
                        onChange={(e) => updateVariant(variant.id, { size: e.target.value })}
                      />
                      <Input
                        placeholder="SKU varian"
                        value={variant.sku}
                        onChange={(e) => updateVariant(variant.id, { sku: e.target.value })}
                      />
                      <Input
                        placeholder="Barcode varian"
                        value={variant.barcode}
                        onChange={(e) => updateVariant(variant.id, { barcode: e.target.value })}
                      />
                      <Input
                        placeholder="Harga jual"
                        type="number"
                        min="0"
                        step="100"
                        value={variant.price}
                        onChange={(e) => updateVariant(variant.id, { price: e.target.value })}
                      />
                      <Input
                        placeholder="Stok awal"
                        type="number"
                        min="0"
                        step="1"
                        value={variant.stock}
                        onChange={(e) => updateVariant(variant.id, { stock: e.target.value })}
                      />
                      <Input
                        placeholder="Nama resep varian"
                        value={variant.recipeName}
                        onChange={(e) => updateVariant(variant.id, { recipeName: e.target.value })}
                      />
                      <Input
                        placeholder="Output per batch"
                        type="number"
                        min="0.0001"
                        step="0.0001"
                        value={variant.outputQty}
                        onChange={(e) => updateVariant(variant.id, { outputQty: e.target.value })}
                      />
                      <Select
                        value={variant.outputUnitId}
                        onValueChange={(value) => updateVariant(variant.id, { outputUnitId: value })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Satuan output" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.code} ({unit.dimension})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Susut (%)"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={variant.lossPercent}
                          onChange={(e) => updateVariant(variant.id, { lossPercent: e.target.value })}
                        />
                        {variants.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              setVariants((rows) => rows.filter((item) => item.id !== variant.id))
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setVariants((rows) => [...rows, createVariantDraft(units[0]?.id ?? "")])
                    }
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
                  {materials.map((row, index) => (
                    <div key={row.id} className="space-y-2 rounded-md border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">Bahan {index + 1}</p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={row.mode === "existing" ? "default" : "outline"}
                            onClick={() => updateMaterial(row.id, { mode: "existing" })}
                          >
                            Pilih terdaftar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={row.mode === "new" ? "default" : "outline"}
                            onClick={() => updateMaterial(row.id, { mode: "new" })}
                          >
                            Tambah baru
                          </Button>
                        </div>
                      </div>

                      {row.mode === "existing" ? (
                        <div className="grid gap-2 md:grid-cols-6">
                          <Select
                            value={row.itemId}
                            onValueChange={(value) => {
                              const selected = items.find((item) => item.id === value);
                              updateMaterial(row.id, {
                                itemId: value,
                                unitId: selected?.defaultUnitId ?? row.unitId,
                              });
                            }}
                          >
                            <SelectTrigger className="w-full md:col-span-2">
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
                          <Select
                            value={row.unitId}
                            onValueChange={(value) => updateMaterial(row.id, { unitId: value })}
                          >
                            <SelectTrigger className="w-full">
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
                          <Input
                            placeholder="Qty"
                            type="number"
                            step="0.0001"
                            value={row.qty}
                            onChange={(e) => updateMaterial(row.id, { qty: e.target.value })}
                          />
                          <Input
                            placeholder="Susut %"
                            type="number"
                            step="0.01"
                            value={row.wastePercent}
                            onChange={(e) => updateMaterial(row.id, { wastePercent: e.target.value })}
                          />
                          <div className="flex items-center justify-between rounded-md border px-3">
                            <label className="text-xs">Opsional</label>
                            <Checkbox
                              checked={row.isOptional}
                              onCheckedChange={(checked) =>
                                updateMaterial(row.id, { isOptional: checked === true })
                              }
                            />
                          </div>
                          {materials.length > 1 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() =>
                                setMaterials((rows) => rows.filter((item) => item.id !== row.id))
                              }
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          ) : null}
                        </div>
                      ) : (
                        <div className="grid gap-2 md:grid-cols-6">
                          <Input
                            className="md:col-span-2"
                            placeholder="Nama bahan baru"
                            value={row.newMaterial.name}
                            onChange={(e) => updateMaterialNewDraft(row.id, { name: e.target.value })}
                          />
                          <Input
                            placeholder="SKU (opsional)"
                            value={row.newMaterial.sku}
                            onChange={(e) => updateMaterialNewDraft(row.id, { sku: e.target.value })}
                          />
                          <Select
                            value={row.newMaterial.itemType}
                            onValueChange={(value) =>
                              updateMaterialNewDraft(row.id, {
                                itemType: value as "raw_material" | "packaging",
                              })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="raw_material">Bahan utama</SelectItem>
                              <SelectItem value="packaging">Kemasan</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={row.newMaterial.unitId}
                            onValueChange={(value) => updateMaterialNewDraft(row.id, { unitId: value })}
                          >
                            <SelectTrigger className="w-full">
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
                          <Input
                            placeholder="Harga awal (opsional)"
                            type="number"
                            min="0"
                            step="100"
                            value={row.newMaterial.initialPrice}
                            onChange={(e) =>
                              updateMaterialNewDraft(row.id, { initialPrice: e.target.value })
                            }
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={async () => {
                              try {
                                const created = await createRawMaterial(row.newMaterial);
                                setItems((prev) => [...prev, created]);
                                updateMaterial(row.id, {
                                  mode: "existing",
                                  itemId: created.id,
                                  unitId: created.defaultUnitId || row.unitId,
                                });
                                updateMaterialNewDraft(row.id, {
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
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setMaterials((rows) => [...rows, createMaterialRow(units[0]?.id ?? "")])
                      }
                    >
                      <Plus className="mr-2 size-4" />
                      Tambah baris bahan
                    </Button>
                    {items.length === 0 ? (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          setMaterials((rows) =>
                            rows.map((row, idx) => (idx === 0 ? { ...row, mode: "new" } : row))
                          )
                        }
                      >
                        <Plus className="mr-2 size-4" />
                        Mulai dengan bahan baru
                      </Button>
                    ) : null}
                  </div>
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
                      <Input
                        placeholder="Nama biaya"
                        value={row.name}
                        onChange={(e) => updateCost(row.id, { name: e.target.value })}
                      />
                      <Select
                        value={row.componentType}
                        onValueChange={(value) =>
                          updateCost(row.id, { componentType: value as CostRow["componentType"] })
                        }
                      >
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
                      <Select
                        value={row.basis}
                        onValueChange={(value) => updateCost(row.id, { basis: value as CostRow["basis"] })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_batch">Per batch</SelectItem>
                          <SelectItem value="per_unit">Per unit</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Nominal"
                        type="number"
                        step="100"
                        value={row.amount}
                        onChange={(e) => updateCost(row.id, { amount: e.target.value })}
                      />
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

