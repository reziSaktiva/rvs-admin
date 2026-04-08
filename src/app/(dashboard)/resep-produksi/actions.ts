"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { recipeCosts, recipeMaterials, recipes } from "@/lib/db/drizzle/schema";

const parseNumber = (value: FormDataEntryValue | null): number => {
  if (typeof value !== "string") return NaN;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

export async function updateRecipeStatusAction(formData: FormData) {
  const recipeId = String(formData.get("recipeId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!recipeId) throw new Error("recipeId is required");
  if (!["draft", "active", "archived"].includes(status)) {
    throw new Error("Invalid recipe status");
  }

  await db
    .update(recipes)
    .set({
      status: status as "draft" | "active" | "archived",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(recipes.id, recipeId));

  revalidatePath("/resep-produksi");
  revalidatePath("/hpp");
}

export async function addRecipeMaterialAction(formData: FormData) {
  const recipeId = String(formData.get("recipeId") ?? "").trim();
  const itemId = String(formData.get("itemId") ?? "").trim();
  const unitId = String(formData.get("unitId") ?? "").trim();
  const qty = parseNumber(formData.get("qty"));
  const wastePercent = parseNumber(formData.get("wastePercent"));
  const sortOrder = parseNumber(formData.get("sortOrder"));
  const isOptional = String(formData.get("isOptional") ?? "") === "on";

  if (!recipeId || !itemId || !unitId) throw new Error("recipeId, itemId, and unitId are required");
  if (!Number.isFinite(qty) || qty <= 0) throw new Error("qty must be greater than 0");

  await db.insert(recipeMaterials).values({
    recipeId,
    itemId,
    unitId,
    qty: String(qty),
    wastePercent: Number.isFinite(wastePercent) ? String(wastePercent) : "0",
    sortOrder: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0,
    isOptional,
  });

  revalidatePath("/resep-produksi");
  revalidatePath("/hpp");
}

export async function updateRecipeMaterialAction(formData: FormData) {
  const materialId = String(formData.get("materialId") ?? "").trim();
  const qty = parseNumber(formData.get("qty"));
  const wastePercent = parseNumber(formData.get("wastePercent"));
  const sortOrder = parseNumber(formData.get("sortOrder"));
  const isOptional = String(formData.get("isOptional") ?? "") === "on";

  if (!materialId) throw new Error("materialId is required");
  if (!Number.isFinite(qty) || qty <= 0) throw new Error("qty must be greater than 0");

  await db
    .update(recipeMaterials)
    .set({
      qty: String(qty),
      wastePercent: Number.isFinite(wastePercent) ? String(wastePercent) : "0",
      sortOrder: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0,
      isOptional,
    })
    .where(eq(recipeMaterials.id, materialId));

  revalidatePath("/resep-produksi");
  revalidatePath("/hpp");
}

export async function deleteRecipeMaterialAction(formData: FormData) {
  const materialId = String(formData.get("materialId") ?? "").trim();
  if (!materialId) throw new Error("materialId is required");

  await db.delete(recipeMaterials).where(eq(recipeMaterials.id, materialId));

  revalidatePath("/resep-produksi");
  revalidatePath("/hpp");
}

export async function addRecipeCostAction(formData: FormData) {
  const recipeId = String(formData.get("recipeId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const componentType = String(formData.get("componentType") ?? "").trim();
  const basis = String(formData.get("basis") ?? "").trim();
  const amount = parseNumber(formData.get("amount"));

  if (!recipeId || !name) throw new Error("recipeId and name are required");
  if (!["material", "labor", "overhead", "other"].includes(componentType)) {
    throw new Error("Invalid componentType");
  }
  if (!["per_batch", "per_unit"].includes(basis)) {
    throw new Error("Invalid basis");
  }
  if (!Number.isFinite(amount) || amount < 0) throw new Error("amount must be >= 0");

  await db.insert(recipeCosts).values({
    recipeId,
    name,
    componentType: componentType as "material" | "labor" | "overhead" | "other",
    basis: basis as "per_batch" | "per_unit",
    amount: String(amount),
  });

  revalidatePath("/resep-produksi");
  revalidatePath("/hpp");
}

export async function updateRecipeCostAction(formData: FormData) {
  const costId = String(formData.get("costId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const componentType = String(formData.get("componentType") ?? "").trim();
  const basis = String(formData.get("basis") ?? "").trim();
  const amount = parseNumber(formData.get("amount"));

  if (!costId || !name) throw new Error("costId and name are required");
  if (!["material", "labor", "overhead", "other"].includes(componentType)) {
    throw new Error("Invalid componentType");
  }
  if (!["per_batch", "per_unit"].includes(basis)) {
    throw new Error("Invalid basis");
  }
  if (!Number.isFinite(amount) || amount < 0) throw new Error("amount must be >= 0");

  await db
    .update(recipeCosts)
    .set({
      name,
      componentType: componentType as "material" | "labor" | "overhead" | "other",
      basis: basis as "per_batch" | "per_unit",
      amount: String(amount),
    })
    .where(eq(recipeCosts.id, costId));

  revalidatePath("/resep-produksi");
  revalidatePath("/hpp");
}

export async function deleteRecipeCostAction(formData: FormData) {
  const costId = String(formData.get("costId") ?? "").trim();
  if (!costId) throw new Error("costId is required");

  await db.delete(recipeCosts).where(eq(recipeCosts.id, costId));

  revalidatePath("/resep-produksi");
  revalidatePath("/hpp");
}
