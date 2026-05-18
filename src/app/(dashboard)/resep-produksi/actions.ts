"use server";

import { and, eq } from "drizzle-orm";
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
import { requireCurrentUserActiveCompanyContext } from "@/lib/company/active-company";

const parseNumber = (value: FormDataEntryValue | null): number => {
  if (typeof value !== "string") return NaN;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const toNullableString = (value: FormDataEntryValue | null): string | null => {
  const parsed = typeof value === "string" ? value.trim() : "";
  return parsed === "" || parsed === "__none" ? null : parsed;
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

const appendQueryToPath = (path: string, params: Record<string, string | undefined>) => {
  const [pathname, existingQuery = ""] = path.split("?");
  const query = new URLSearchParams(existingQuery);

  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });

  const queryString = query.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
};

const sanitizeRedirectTo = (value: FormDataEntryValue | null) => {
  const parsed = String(value ?? "").trim();
  if (!parsed) return null;
  if (parsed.startsWith("/resep-produksi/")) return parsed;
  return null;
};

const routeToRecipe = (recipeId: string, status?: string, error?: string) =>
  `/resep-produksi/${recipeId}${buildQuery({
    status,
    error,
  })}`;

const routeToError = (error: string, recipeId?: string, status?: string) =>
  `/resep-produksi${buildQuery({
    error,
    recipeId,
    status,
  })}`;

const routeToErrorOrFallback = (
  error: string,
  recipeId: string | undefined,
  status: string | undefined,
  redirectTo: string | null
) => {
  if (redirectTo) return appendQueryToPath(redirectTo, { error });
  return routeToError(error, recipeId, status);
};

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
  const activeContext = await requireCurrentUserActiveCompanyContext();
  const productVariantId = String(formData.get("productVariantId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() || undefined;

  if (!productVariantId) {
    redirect(routeToError("varian_wajib", undefined, status));
  }
  const variant = await db.query.productVariant.findFirst({
    where: and(
      eq(productVariant.id, productVariantId),
      eq(productVariant.companyId, activeContext.companyId)
    ),
    columns: { id: true },
  });
  if (!variant) {
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
        companyId: activeContext.companyId,
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
  const activeContext = await requireCurrentUserActiveCompanyContext();
  const productId = String(formData.get("productId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() || undefined;
  if (!productId) {
    redirect(routeToError("produk_wajib", undefined, status));
  }
  const targetProduct = await db.query.product.findFirst({
    where: and(eq(product.id, productId), eq(product.companyId, activeContext.companyId)),
    columns: { id: true },
  });
  if (!targetProduct) {
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
          companyId: activeContext.companyId,
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
          companyId: activeContext.companyId,
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
  const activeContext = await requireCurrentUserActiveCompanyContext();
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
          companyId: activeContext.companyId,
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
          companyId: activeContext.companyId,
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
          companyId: activeContext.companyId,
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
  const activeContext = await requireCurrentUserActiveCompanyContext();
  const recipeId = String(formData.get("recipeId") ?? "").trim();
  const productId = String(formData.get("productId") ?? "").trim();
  const variantId = String(formData.get("variantId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() || undefined;
  const redirectTo = sanitizeRedirectTo(formData.get("redirectTo"));

  if (!recipeId || !productId || !variantId) {
    redirect(routeToErrorOrFallback("data_produk_tidak_lengkap", recipeId, status, redirectTo));
  }

  const productName = String(formData.get("productName") ?? "").trim();
  if (!productName) {
    redirect(routeToErrorOrFallback("nama_produk_wajib", recipeId, status, redirectTo));
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
    redirect(routeToErrorOrFallback("harga_varian_invalid", recipeId, status, redirectTo));
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
        .where(and(eq(product.id, productId), eq(product.companyId, activeContext.companyId)));

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
        .where(
          and(
            eq(productVariant.id, variantId),
            eq(productVariant.companyId, activeContext.companyId)
          )
        );
    });
  } catch (error) {
    if (
      isUniqueViolation(error, "product_variants_sku_key") ||
      isUniqueViolation(error, "product_variants_barcode_key")
    ) {
      redirect(routeToErrorOrFallback("sku_barcode_duplikat", recipeId, status, redirectTo));
    }
    throw error;
  }

  revalidatePath("/resep-produksi");
  revalidatePath("/produk");
  if (redirectTo) {
    redirect(appendQueryToPath(redirectTo, { success: "produk_varian_disimpan" }));
  }
  redirect(routeToRecipe(recipeId, status));
}

export async function updateRecipeStatusAction(formData: FormData) {
  const activeContext = await requireCurrentUserActiveCompanyContext();
  const recipeId = String(formData.get("recipeId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const redirectTo = sanitizeRedirectTo(formData.get("redirectTo"));
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
    .where(and(eq(recipes.id, recipeId), eq(recipes.companyId, activeContext.companyId)));

  revalidatePath("/resep-produksi");
  revalidatePath("/hpp");
  if (redirectTo) {
    redirect(appendQueryToPath(redirectTo, { success: "status_resep_disimpan" }));
  }
}

export async function updateRecipeCoreAction(formData: FormData) {
  const activeContext = await requireCurrentUserActiveCompanyContext();
  const recipeId = String(formData.get("recipeId") ?? "").trim();
  const statusFilter = String(formData.get("statusFilter") ?? "").trim() || undefined;
  const status = String(formData.get("status") ?? "").trim();
  const redirectTo = sanitizeRedirectTo(formData.get("redirectTo"));

  if (!recipeId) {
    redirect(routeToErrorOrFallback("data_resep_tidak_lengkap", undefined, statusFilter, redirectTo));
  }

  let recipeCore: ReturnType<typeof validateRecipeCore>;
  try {
    recipeCore = validateRecipeCore(formData);
  } catch (error) {
    const code = error instanceof Error ? error.message : "VALIDASI_GAGAL";
    redirect(routeToErrorOrFallback(code.toLowerCase(), recipeId, statusFilter, redirectTo));
  }

  if (!["draft", "active", "archived"].includes(status)) {
    redirect(routeToErrorOrFallback("status_resep_invalid", recipeId, statusFilter, redirectTo));
  }

  try {
    await db
      .update(recipes)
      .set({
        ...recipeCore!,
        status: status as "draft" | "active" | "archived",
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(recipes.id, recipeId), eq(recipes.companyId, activeContext.companyId)));
  } catch (error) {
    if (isUniqueViolation(error, "recipes_product_variant_id_name_key")) {
      redirect(routeToErrorOrFallback("nama_resep_duplikat", recipeId, statusFilter, redirectTo));
    }
    throw error;
  }

  revalidatePath("/resep-produksi");
  revalidatePath("/hpp");
  if (redirectTo) {
    redirect(appendQueryToPath(redirectTo, { success: "resep_disimpan" }));
  }
  redirect(routeToRecipe(recipeId, statusFilter));
}

export async function addRecipeMaterialAction(formData: FormData) {
  const activeContext = await requireCurrentUserActiveCompanyContext();
  const recipeId = String(formData.get("recipeId") ?? "").trim();
  const itemId = String(formData.get("itemId") ?? "").trim();
  const unitId = String(formData.get("unitId") ?? "").trim();
  const qty = parseNumber(formData.get("qty"));
  const wastePercent = parseNumber(formData.get("wastePercent"));
  const sortOrder = parseNumber(formData.get("sortOrder"));
  const isOptional = String(formData.get("isOptional") ?? "") === "on";
  const redirectTo = sanitizeRedirectTo(formData.get("redirectTo"));

  if (!recipeId || !itemId || !unitId) {
    if (redirectTo) redirect(appendQueryToPath(redirectTo, { error: "material_tidak_lengkap" }));
    throw new Error("recipeId, itemId, and unitId are required");
  }
  if (!Number.isFinite(qty) || qty <= 0) {
    if (redirectTo) redirect(appendQueryToPath(redirectTo, { error: "qty_material_invalid" }));
    throw new Error("qty must be greater than 0");
  }

  await db.insert(recipeMaterials).values({
    companyId: activeContext.companyId,
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
  if (redirectTo) {
    redirect(appendQueryToPath(redirectTo, { success: "material_ditambahkan" }));
  }
}

export async function updateRecipeMaterialAction(formData: FormData) {
  const activeContext = await requireCurrentUserActiveCompanyContext();
  const materialId = String(formData.get("materialId") ?? "").trim();
  const qty = parseNumber(formData.get("qty"));
  const wastePercent = parseNumber(formData.get("wastePercent"));
  const sortOrder = parseNumber(formData.get("sortOrder"));
  const isOptional = String(formData.get("isOptional") ?? "") === "on";
  const redirectTo = sanitizeRedirectTo(formData.get("redirectTo"));

  if (!materialId) {
    if (redirectTo) redirect(appendQueryToPath(redirectTo, { error: "material_tidak_lengkap" }));
    throw new Error("materialId is required");
  }
  if (!Number.isFinite(qty) || qty <= 0) {
    if (redirectTo) redirect(appendQueryToPath(redirectTo, { error: "qty_material_invalid" }));
    throw new Error("qty must be greater than 0");
  }

  await db
    .update(recipeMaterials)
    .set({
      qty: String(qty),
      wastePercent: Number.isFinite(wastePercent) ? String(wastePercent) : "0",
      sortOrder: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0,
      isOptional,
    })
    .where(and(eq(recipeMaterials.id, materialId), eq(recipeMaterials.companyId, activeContext.companyId)));

  revalidatePath("/resep-produksi");
  revalidatePath("/hpp");
  if (redirectTo) {
    redirect(appendQueryToPath(redirectTo, { success: "material_disimpan" }));
  }
}

export async function deleteRecipeMaterialAction(formData: FormData) {
  const activeContext = await requireCurrentUserActiveCompanyContext();
  const materialId = String(formData.get("materialId") ?? "").trim();
  const redirectTo = sanitizeRedirectTo(formData.get("redirectTo"));
  if (!materialId) {
    if (redirectTo) redirect(appendQueryToPath(redirectTo, { error: "material_tidak_lengkap" }));
    throw new Error("materialId is required");
  }

  await db
    .delete(recipeMaterials)
    .where(and(eq(recipeMaterials.id, materialId), eq(recipeMaterials.companyId, activeContext.companyId)));

  revalidatePath("/resep-produksi");
  revalidatePath("/hpp");
  if (redirectTo) {
    redirect(appendQueryToPath(redirectTo, { success: "material_dihapus" }));
  }
}

export async function addRecipeCostAction(formData: FormData) {
  const activeContext = await requireCurrentUserActiveCompanyContext();
  const recipeId = String(formData.get("recipeId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const componentType = String(formData.get("componentType") ?? "").trim();
  const basis = String(formData.get("basis") ?? "").trim();
  const amount = parseNumber(formData.get("amount"));
  const redirectTo = sanitizeRedirectTo(formData.get("redirectTo"));

  if (!recipeId || !name) {
    if (redirectTo) redirect(appendQueryToPath(redirectTo, { error: "biaya_tidak_lengkap" }));
    throw new Error("recipeId and name are required");
  }
  if (!["material", "labor", "overhead", "other"].includes(componentType)) {
    if (redirectTo) redirect(appendQueryToPath(redirectTo, { error: "jenis_biaya_invalid" }));
    throw new Error("Invalid componentType");
  }
  if (!["per_batch", "per_unit"].includes(basis)) {
    if (redirectTo) redirect(appendQueryToPath(redirectTo, { error: "basis_biaya_invalid" }));
    throw new Error("Invalid basis");
  }
  if (!Number.isFinite(amount) || amount < 0) {
    if (redirectTo) redirect(appendQueryToPath(redirectTo, { error: "nominal_biaya_invalid" }));
    throw new Error("amount must be >= 0");
  }

  await db.insert(recipeCosts).values({
    companyId: activeContext.companyId,
    recipeId,
    name,
    componentType: componentType as "material" | "labor" | "overhead" | "other",
    basis: basis as "per_batch" | "per_unit",
    amount: String(amount),
  });

  revalidatePath("/resep-produksi");
  revalidatePath("/hpp");
  if (redirectTo) {
    redirect(appendQueryToPath(redirectTo, { success: "biaya_ditambahkan" }));
  }
}

export async function updateRecipeCostAction(formData: FormData) {
  const activeContext = await requireCurrentUserActiveCompanyContext();
  const costId = String(formData.get("costId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const componentType = String(formData.get("componentType") ?? "").trim();
  const basis = String(formData.get("basis") ?? "").trim();
  const amount = parseNumber(formData.get("amount"));
  const redirectTo = sanitizeRedirectTo(formData.get("redirectTo"));

  if (!costId || !name) {
    if (redirectTo) redirect(appendQueryToPath(redirectTo, { error: "biaya_tidak_lengkap" }));
    throw new Error("costId and name are required");
  }
  if (!["material", "labor", "overhead", "other"].includes(componentType)) {
    if (redirectTo) redirect(appendQueryToPath(redirectTo, { error: "jenis_biaya_invalid" }));
    throw new Error("Invalid componentType");
  }
  if (!["per_batch", "per_unit"].includes(basis)) {
    if (redirectTo) redirect(appendQueryToPath(redirectTo, { error: "basis_biaya_invalid" }));
    throw new Error("Invalid basis");
  }
  if (!Number.isFinite(amount) || amount < 0) {
    if (redirectTo) redirect(appendQueryToPath(redirectTo, { error: "nominal_biaya_invalid" }));
    throw new Error("amount must be >= 0");
  }

  await db
    .update(recipeCosts)
    .set({
      name,
      componentType: componentType as "material" | "labor" | "overhead" | "other",
      basis: basis as "per_batch" | "per_unit",
      amount: String(amount),
    })
    .where(and(eq(recipeCosts.id, costId), eq(recipeCosts.companyId, activeContext.companyId)));

  revalidatePath("/resep-produksi");
  revalidatePath("/hpp");
  if (redirectTo) {
    redirect(appendQueryToPath(redirectTo, { success: "biaya_disimpan" }));
  }
}

export async function deleteRecipeCostAction(formData: FormData) {
  const activeContext = await requireCurrentUserActiveCompanyContext();
  const costId = String(formData.get("costId") ?? "").trim();
  const redirectTo = sanitizeRedirectTo(formData.get("redirectTo"));
  if (!costId) {
    if (redirectTo) redirect(appendQueryToPath(redirectTo, { error: "biaya_tidak_lengkap" }));
    throw new Error("costId is required");
  }

  await db
    .delete(recipeCosts)
    .where(and(eq(recipeCosts.id, costId), eq(recipeCosts.companyId, activeContext.companyId)));

  revalidatePath("/resep-produksi");
  revalidatePath("/hpp");
  if (redirectTo) {
    redirect(appendQueryToPath(redirectTo, { success: "biaya_dihapus" }));
  }
}
