"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  product,
  productVariant,
  recipeCosts,
  recipeMaterials,
  recipes,
} from "@/lib/db/drizzle/schema";

const parseNumber = (value: FormDataEntryValue | null): number => {
  if (typeof value !== "string") return NaN;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const toNullableString = (value: FormDataEntryValue | null): string | null => {
  const parsed = typeof value === "string" ? value.trim() : "";
  return parsed === "" ? null : parsed;
};

const toBoolean = (value: FormDataEntryValue | null, fallback = true): boolean => {
  if (value === null) return fallback;
  return String(value) === "on" || String(value) === "true";
};

const buildQuery = (params: Record<string, string | undefined>) => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) qp.set(k, v);
  });
  const qs = qp.toString();
  return qs ? `?${qs}` : "";
};

const routeToRecipe = (recipeId: string, status?: string, error?: string) =>
  `/resep-produksi${buildQuery({
    recipeId,
    status,
    error,
  })}`;

const routeToError = (error: string, recipeId?: string, status?: string) =>
  `/resep-produksi${buildQuery({
    error,
    recipeId,
    status,
  })}`;

const isUniqueViolation = (error: unknown, constraintName?: string): boolean => {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code: unknown }).code) : "";
  const message =
    "message" in error ? String((error as { message: unknown }).message) : String(error);
  if (code !== "23505") return false;
  if (!constraintName) return true;
  return message.includes(constraintName);
};

const validateRecipeCore = (formData: FormData) => {
  const name = String(formData.get("name") ?? "").trim();
  const outputUnitId = String(formData.get("outputUnitId") ?? "").trim();
  const outputQty = parseNumber(formData.get("outputQty"));
  const lossPercent = parseNumber(formData.get("lossPercent"));

  if (!name) throw new Error("NAMA_RESEP_KOSONG");
  if (!outputUnitId) throw new Error("SATUAN_KOSONG");
  if (!Number.isFinite(outputQty) || outputQty <= 0) throw new Error("QTY_INVALID");
  if (Number.isFinite(lossPercent) && (lossPercent < 0 || lossPercent > 100)) {
    throw new Error("SUSUT_INVALID");
  }

  return {
    name,
    outputUnitId,
    outputQty: String(outputQty),
    lossPercent: String(Number.isFinite(lossPercent) ? lossPercent : 0),
  };
};

export async function createRecipeWithExistingVariantAction(formData: FormData) {
  const productVariantId = String(formData.get("productVariantId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() || undefined;

  if (!productVariantId) {
    redirect(routeToError("varian_wajib", undefined, status));
  }

  let recipeCore: ReturnType<typeof validateRecipeCore>;
  try {
    recipeCore = validateRecipeCore(formData);
  } catch (error) {
    const code = error instanceof Error ? error.message : "VALIDASI_GAGAL";
    redirect(routeToError(code.toLowerCase(), undefined, status));
  }

  try {
    const [inserted] = await db
      .insert(recipes)
      .values({
        productVariantId,
        ...recipeCore!,
        status: "draft",
        updatedAt: new Date().toISOString(),
      })
      .returning({ id: recipes.id });

    if (!inserted?.id) {
      redirect(routeToError("resep_gagal_disimpan", undefined, status));
    }

    revalidatePath("/resep-produksi");
    revalidatePath("/hpp");
    redirect(routeToRecipe(inserted.id, status));
  } catch (error) {
    if (isUniqueViolation(error, "recipes_product_variant_id_name_key")) {
      redirect(routeToError("nama_resep_duplikat", undefined, status));
    }
    throw error;
  }
}

export async function createVariantAndRecipeForExistingProductAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() || undefined;
  if (!productId) {
    redirect(routeToError("produk_wajib", undefined, status));
  }

  const size = toNullableString(formData.get("variantSize"));
  const sku = toNullableString(formData.get("variantSku"));
  const barcode = toNullableString(formData.get("variantBarcode"));
  const price = parseNumber(formData.get("variantPrice"));
  const stock = parseNumber(formData.get("variantStock"));
  const isActive = toBoolean(formData.get("variantIsActive"), true);

  if (!Number.isFinite(price) || price < 0) {
    redirect(routeToError("harga_varian_invalid", undefined, status));
  }

  let recipeCore: ReturnType<typeof validateRecipeCore>;
  try {
    recipeCore = validateRecipeCore(formData);
  } catch (error) {
    const code = error instanceof Error ? error.message : "VALIDASI_GAGAL";
    redirect(routeToError(code.toLowerCase(), undefined, status));
  }

  try {
    const recipeId = await db.transaction(async (tx) => {
      const [newVariant] = await tx
        .insert(productVariant)
        .values({
          productId,
          size,
          sku,
          barcode,
          price: String(price),
          stock: Number.isFinite(stock) ? Math.max(0, Math.trunc(stock)) : 0,
          isActive,
          updatedAt: new Date().toISOString(),
        })
        .returning({ id: productVariant.id });

      if (!newVariant?.id) throw new Error("VARIAN_GAGAL");

      const [newRecipe] = await tx
        .insert(recipes)
        .values({
          productVariantId: newVariant.id,
          ...recipeCore!,
          status: "draft",
          updatedAt: new Date().toISOString(),
        })
        .returning({ id: recipes.id });

      if (!newRecipe?.id) throw new Error("RESEP_GAGAL");
      return newRecipe.id;
    });

    revalidatePath("/resep-produksi");
    revalidatePath("/produk");
    revalidatePath("/hpp");
    redirect(routeToRecipe(recipeId, status));
  } catch (error) {
    if (
      isUniqueViolation(error, "product_variants_sku_key") ||
      isUniqueViolation(error, "product_variants_barcode_key")
    ) {
      redirect(routeToError("sku_barcode_duplikat", undefined, status));
    }
    if (isUniqueViolation(error, "recipes_product_variant_id_name_key")) {
      redirect(routeToError("nama_resep_duplikat", undefined, status));
    }
    throw error;
  }
}

export async function createProductVariantAndRecipeAction(formData: FormData) {
  const status = String(formData.get("status") ?? "").trim() || undefined;
  const productName = String(formData.get("productName") ?? "").trim();
  const productDescription = toNullableString(formData.get("productDescription"));
  const categoryId = toNullableString(formData.get("categoryId"));
  const productIsActive = toBoolean(formData.get("productIsActive"), true);

  if (!productName) {
    redirect(routeToError("nama_produk_wajib", undefined, status));
  }

  const size = toNullableString(formData.get("variantSize"));
  const sku = toNullableString(formData.get("variantSku"));
  const barcode = toNullableString(formData.get("variantBarcode"));
  const price = parseNumber(formData.get("variantPrice"));
  const stock = parseNumber(formData.get("variantStock"));
  const variantIsActive = toBoolean(formData.get("variantIsActive"), true);

  if (!Number.isFinite(price) || price < 0) {
    redirect(routeToError("harga_varian_invalid", undefined, status));
  }

  let recipeCore: ReturnType<typeof validateRecipeCore>;
  try {
    recipeCore = validateRecipeCore(formData);
  } catch (error) {
    const code = error instanceof Error ? error.message : "VALIDASI_GAGAL";
    redirect(routeToError(code.toLowerCase(), undefined, status));
  }

  try {
    const recipeId = await db.transaction(async (tx) => {
      const [newProduct] = await tx
        .insert(product)
        .values({
          name: productName,
          description: productDescription,
          categoryId,
          isActive: productIsActive,
          updatedAt: new Date().toISOString(),
        })
        .returning({ id: product.id });

      if (!newProduct?.id) throw new Error("PRODUK_GAGAL");

      const [newVariant] = await tx
        .insert(productVariant)
        .values({
          productId: newProduct.id,
          size,
          sku,
          barcode,
          price: String(price),
          stock: Number.isFinite(stock) ? Math.max(0, Math.trunc(stock)) : 0,
          isActive: variantIsActive,
          updatedAt: new Date().toISOString(),
        })
        .returning({ id: productVariant.id });

      if (!newVariant?.id) throw new Error("VARIAN_GAGAL");

      const [newRecipe] = await tx
        .insert(recipes)
        .values({
          productVariantId: newVariant.id,
          ...recipeCore!,
          status: "draft",
          updatedAt: new Date().toISOString(),
        })
        .returning({ id: recipes.id });

      if (!newRecipe?.id) throw new Error("RESEP_GAGAL");
      return newRecipe.id;
    });

    revalidatePath("/resep-produksi");
    revalidatePath("/produk");
    revalidatePath("/hpp");
    redirect(routeToRecipe(recipeId, status));
  } catch (error) {
    if (
      isUniqueViolation(error, "product_variants_sku_key") ||
      isUniqueViolation(error, "product_variants_barcode_key")
    ) {
      redirect(routeToError("sku_barcode_duplikat", undefined, status));
    }
    if (isUniqueViolation(error, "recipes_product_variant_id_name_key")) {
      redirect(routeToError("nama_resep_duplikat", undefined, status));
    }
    throw error;
  }
}

export async function updateProductAndVariantAction(formData: FormData) {
  const recipeId = String(formData.get("recipeId") ?? "").trim();
  const productId = String(formData.get("productId") ?? "").trim();
  const variantId = String(formData.get("variantId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() || undefined;

  if (!recipeId || !productId || !variantId) {
    redirect(routeToError("data_produk_tidak_lengkap", recipeId, status));
  }

  const productName = String(formData.get("productName") ?? "").trim();
  if (!productName) {
    redirect(routeToError("nama_produk_wajib", recipeId, status));
  }

  const productDescription = toNullableString(formData.get("productDescription"));
  const categoryId = toNullableString(formData.get("categoryId"));
  const productIsActive = toBoolean(formData.get("productIsActive"), true);
  const variantSize = toNullableString(formData.get("variantSize"));
  const variantSku = toNullableString(formData.get("variantSku"));
  const variantBarcode = toNullableString(formData.get("variantBarcode"));
  const variantPrice = parseNumber(formData.get("variantPrice"));
  const variantStock = parseNumber(formData.get("variantStock"));
  const variantIsActive = toBoolean(formData.get("variantIsActive"), true);

  if (!Number.isFinite(variantPrice) || variantPrice < 0) {
    redirect(routeToError("harga_varian_invalid", recipeId, status));
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(product)
        .set({
          name: productName,
          description: productDescription,
          categoryId,
          isActive: productIsActive,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(product.id, productId));

      await tx
        .update(productVariant)
        .set({
          size: variantSize,
          sku: variantSku,
          barcode: variantBarcode,
          price: String(variantPrice),
          stock: Number.isFinite(variantStock) ? Math.max(0, Math.trunc(variantStock)) : 0,
          isActive: variantIsActive,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(productVariant.id, variantId));
    });
  } catch (error) {
    if (
      isUniqueViolation(error, "product_variants_sku_key") ||
      isUniqueViolation(error, "product_variants_barcode_key")
    ) {
      redirect(routeToError("sku_barcode_duplikat", recipeId, status));
    }
    throw error;
  }

  revalidatePath("/resep-produksi");
  revalidatePath("/produk");
  redirect(routeToRecipe(recipeId, status));
}

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
