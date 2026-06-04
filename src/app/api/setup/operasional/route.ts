import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  costItems,
  product,
  productVariant,
  recipeCosts,
  recipeMaterials,
  recipes,
} from "@/lib/db/drizzle/schema";
import { requireCurrentUserActiveCompanyContext } from "@/lib/company/active-company";
import { calculateHpp } from "@/lib/hpp";

type MaterialInput = {
  itemId: string;
  unitId: string;
  qty: number;
  wastePercent?: number;
  isOptional?: boolean;
  sortOrder?: number;
};

type CostInput = {
  name: string;
  componentType: "material" | "labor" | "overhead" | "other";
  basis: "per_batch" | "per_unit";
  amount: number;
};

type VariantRecipeInput = {
  size?: string;
  sku?: string;
  barcode?: string;
  price?: number;
  stock?: number;
  recipeName?: string;
  outputQty?: number;
  outputUnitId?: string;
  lossPercent?: number;
};

export async function POST(request: Request) {
  try {
    const activeContext = await requireCurrentUserActiveCompanyContext();
    const body = (await request.json()) as {
      productName?: string;
      productDescription?: string;
      categoryId?: string | null;
      variants?: VariantRecipeInput[];
      materials?: MaterialInput[];
      costs?: CostInput[];
    };

    const productName = String(body.productName ?? "").trim();
    const variantRows = Array.isArray(body.variants) ? body.variants : [];
    const materialRows = Array.isArray(body.materials) ? body.materials : [];
    const costRows = Array.isArray(body.costs) ? body.costs : [];

    if (!productName) {
      return NextResponse.json(
        { success: false, message: "Nama produk wajib diisi." },
        { status: 400 }
      );
    }
    if (variantRows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tambahkan minimal 1 varian pada setup operasional." },
        { status: 400 }
      );
    }

    const validatedVariants = variantRows.map((row, index) => {
      const recipeName = String(row.recipeName ?? "").trim();
      const outputUnitId = String(row.outputUnitId ?? "").trim();
      const outputQty = Number(row.outputQty);
      const lossPercent = Number(row.lossPercent ?? 0);
      const price = Number(row.price ?? 0);

      if (!recipeName || !outputUnitId) {
        throw new Error(`Varian #${index + 1}: nama resep dan satuan output wajib diisi.`);
      }
      if (!Number.isFinite(outputQty) || outputQty <= 0) {
        throw new Error(`Varian #${index + 1}: output resep harus lebih dari 0.`);
      }
      if (!Number.isFinite(lossPercent) || lossPercent < 0 || lossPercent > 100) {
        throw new Error(`Varian #${index + 1}: nilai susut harus di antara 0-100.`);
      }
      if (!Number.isFinite(price) || price < 0) {
        throw new Error(`Varian #${index + 1}: harga varian tidak valid.`);
      }

      return {
        size: String(row.size ?? "").trim() || null,
        sku: String(row.sku ?? "").trim() || null,
        barcode: String(row.barcode ?? "").trim() || null,
        price,
        stock: Number.isFinite(Number(row.stock ?? 0))
          ? Math.max(0, Math.trunc(Number(row.stock ?? 0)))
          : 0,
        recipeName,
        outputQty,
        outputUnitId,
        lossPercent,
      };
    });

    const materialItemIds = [...new Set(materialRows.map((row) => row.itemId))];
    if (materialItemIds.length > 0) {
      const validItems = await db.query.costItems.findMany({
        where: and(
          eq(costItems.companyId, activeContext.companyId),
          inArray(costItems.id, materialItemIds)
        ),
        columns: { id: true },
      });
      if (validItems.length !== materialItemIds.length) {
        return NextResponse.json(
          { success: false, message: "Ada bahan yang tidak valid untuk company aktif." },
          { status: 400 }
        );
      }
    }

    const result = await db.transaction(async (tx) => {
      const [newProduct] = await tx
        .insert(product)
        .values({
          companyId: activeContext.companyId,
          name: productName,
          description: String(body.productDescription ?? "").trim() || null,
          categoryId: body.categoryId ? String(body.categoryId) : null,
          isActive: true,
          updatedAt: new Date().toISOString(),
        })
        .returning({ id: product.id });

      if (!newProduct?.id) throw new Error("Gagal membuat produk.");

      const createdVariants: Array<{
        variantId: string;
        recipeId: string;
        size: string | null;
        recipeName: string;
      }> = [];

      for (const variant of validatedVariants) {
        const [newVariant] = await tx
          .insert(productVariant)
          .values({
            companyId: activeContext.companyId,
            productId: newProduct.id,
            size: variant.size,
            sku: variant.sku,
            barcode: variant.barcode,
            price: String(variant.price),
            stock: variant.stock,
            isActive: true,
            updatedAt: new Date().toISOString(),
          })
          .returning({ id: productVariant.id });

        if (!newVariant?.id) throw new Error("Gagal membuat varian.");

        const [newRecipe] = await tx
          .insert(recipes)
          .values({
            companyId: activeContext.companyId,
            productVariantId: newVariant.id,
            name: variant.recipeName,
            outputQty: String(variant.outputQty),
            outputUnitId: variant.outputUnitId,
            lossPercent: String(variant.lossPercent),
            status: "draft",
            updatedAt: new Date().toISOString(),
          })
          .returning({ id: recipes.id });

        if (!newRecipe?.id) throw new Error("Gagal membuat resep.");

        if (materialRows.length > 0) {
          await tx.insert(recipeMaterials).values(
            materialRows.map((row, index) => ({
              companyId: activeContext.companyId,
              recipeId: newRecipe.id,
              itemId: row.itemId,
              unitId: row.unitId,
              qty: String(Number(row.qty)),
              wastePercent: String(Number(row.wastePercent ?? 0)),
              isOptional: Boolean(row.isOptional ?? false),
              sortOrder: Number.isFinite(row.sortOrder) ? Math.trunc(row.sortOrder!) : index,
            }))
          );
        }

        if (costRows.length > 0) {
          await tx.insert(recipeCosts).values(
            costRows.map((row) => ({
              companyId: activeContext.companyId,
              recipeId: newRecipe.id,
              name: row.name,
              componentType: row.componentType,
              basis: row.basis,
              amount: String(Number(row.amount)),
            }))
          );
        }

        createdVariants.push({
          variantId: newVariant.id,
          recipeId: newRecipe.id,
          size: variant.size,
          recipeName: variant.recipeName,
        });
      }

      return {
        productId: newProduct.id,
        variants: createdVariants,
      };
    });

    const previews = await Promise.all(
      result.variants.map(async (entry) => {
        const hppPreview = await calculateHpp(activeContext.companyId, entry.recipeId);
        return {
          variantId: entry.variantId,
          recipeId: entry.recipeId,
          size: entry.size,
          recipeName: entry.recipeName,
          hppPerUnit: hppPreview.totals.hppPerOutputUnit,
          materialCost: hppPreview.totals.materialCost,
          additionalCost: hppPreview.totals.additionalCost,
          warnings: hppPreview.warnings,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        productId: result.productId,
        variants: previews,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Gagal menyimpan setup operasional",
      },
      { status: 400 }
    );
  }
}

