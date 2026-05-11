"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { costItemPrices, costItems } from "@/lib/db/drizzle/schema";
import { recordInventoryMovement } from "@/lib/inventory";

const toNumber = (value: FormDataEntryValue | null): number => {
  if (typeof value !== "string") return NaN;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

export async function addRawMaterialAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const itemTypeInput = String(formData.get("itemType") ?? "raw_material").trim();
  const unitId = String(formData.get("unitId") ?? "").trim();

  const initialPrice = toNumber(formData.get("initialPrice"));
  const openingQty = toNumber(formData.get("openingQty"));
  const openingUnitCost = toNumber(formData.get("openingUnitCost"));

  if (!name || !unitId) {
    throw new Error("Nama bahan dan unit wajib diisi");
  }

  const itemType = itemTypeInput === "packaging" ? "packaging" : "raw_material";

  const existingByName = await db.query.costItems.findFirst({
    where: eq(costItems.name, name),
    columns: { id: true },
  });
  if (existingByName) {
    throw new Error("Nama bahan sudah ada");
  }

  if (sku) {
    const existingBySku = await db.query.costItems.findFirst({
      where: eq(costItems.sku, sku),
      columns: { id: true },
    });
    if (existingBySku) {
      throw new Error("SKU sudah digunakan");
    }
  }

  const inserted = await db
    .insert(costItems)
    .values({
      name,
      sku: sku || null,
      itemType,
      defaultUnitId: unitId,
      isActive: true,
    })
    .returning({ id: costItems.id });

  const itemId = inserted[0]?.id;
  if (!itemId) {
    throw new Error("Gagal membuat bahan baku");
  }

  if (Number.isFinite(initialPrice) && initialPrice > 0) {
    await db.insert(costItemPrices).values({
      itemId,
      unitId,
      pricePerUnit: String(initialPrice),
      sourceNote: "manual_setup",
    });
  }

  if (Number.isFinite(openingQty) && openingQty > 0) {
    const unitCostForOpening =
      Number.isFinite(openingUnitCost) && openingUnitCost > 0
        ? openingUnitCost
        : Number.isFinite(initialPrice) && initialPrice > 0
          ? initialPrice
          : NaN;

    if (!Number.isFinite(unitCostForOpening) || unitCostForOpening <= 0) {
      throw new Error("Untuk saldo awal, isi harga unit awal atau harga beli awal");
    }

    await recordInventoryMovement({
      itemId,
      movementType: "opening",
      qtyDelta: openingQty,
      unitId,
      unitCost: unitCostForOpening,
      referenceType: "manual_opening",
      referenceId: itemId,
      note: "Input saldo awal dari halaman bahan baku",
    });
  }

  revalidatePath("/bahan-baku");
  revalidatePath("/pembelian");
  revalidatePath("/riwayat-stok");
  revalidatePath("/");
}

export async function setRawMaterialReferencePriceAction(formData: FormData) {
  const selectedItem = String(formData.get("itemSelection") ?? "").trim();
  const price = toNumber(formData.get("pricePerUnit"));

  const [itemId, unitId] = selectedItem.split("::");
  if (!itemId || !unitId) {
    throw new Error("Bahan dan satuan wajib dipilih");
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Harga acuan harus lebih besar dari nol");
  }

  const item = await db.query.costItems.findFirst({
    where: and(
      eq(costItems.id, itemId),
      eq(costItems.isActive, true),
      inArray(costItems.itemType, ["raw_material", "packaging"])
    ),
    columns: {
      id: true,
    },
  });

  if (!item) {
    throw new Error("Bahan tidak ditemukan");
  }

  await db.insert(costItemPrices).values({
    itemId,
    unitId,
    pricePerUnit: String(price),
    sourceNote: "manual_update",
  });

  revalidatePath("/bahan-baku");
  revalidatePath("/hpp");
  revalidatePath("/resep-produksi");
  revalidatePath("/");
  redirect(`/bahan-baku?referenceItemId=${encodeURIComponent(itemId)}`);
}
