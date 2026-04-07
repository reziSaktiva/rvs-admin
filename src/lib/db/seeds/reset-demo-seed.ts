import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  costItemInventoryBalances,
  costItemInventoryMovements,
  costItemPrices,
  costItems,
  product,
  productKeywords,
  productVariant,
  recipeCosts,
  recipeMaterials,
  recipes,
} from "@/lib/db/drizzle/schema";

const DEMO_PRICE_SOURCE_NOTE = "seed-default-cost-items-v1";
const DEMO_OPENING_REFERENCE_TYPE = "seed_opening_inventory_v1";

const DEMO_PRODUCT_NAMES = [
  "Paket Kaos Kaki Lusin",
  "Kemeja Katun Basic",
  "Celana Jeans Basic",
];

const DEMO_VARIANT_SKUS = ["SOCK-DOZEN-STD", "SHIRT-BASIC-M", "JEANS-BASIC-32"];

const DEMO_RECIPE_NAMES = [
  "Resep Repack Kaos Kaki Lusin",
  "Resep Produksi Jeans Internal",
  "Resep Produksi Baju Vendor",
];

const DEMO_COST_ITEM_SKUS = [
  "RM-SOCK-PLAIN",
  "PK-SOCK-SMALL",
  "PK-LABEL-STICK",
  "PK-SOCK-DOZEN",
  "RM-THREAD",
  "RM-COTTON",
  "RM-BUTTON",
  "RM-ZIPPER",
  "SV-SEW-VENDOR",
];

const resetDemoSeed = async () => {
  // 1) Remove seed opening inventory movements by reference marker.
  await db
    .delete(costItemInventoryMovements)
    .where(
      eq(costItemInventoryMovements.referenceType, DEMO_OPENING_REFERENCE_TYPE)
    );

  // 2) Remove balances for demo cost items.
  const demoItems = await db.query.costItems.findMany({
    where: inArray(costItems.sku, DEMO_COST_ITEM_SKUS),
    columns: { id: true },
  });
  const demoItemIds = demoItems.map((item) => item.id);
  if (demoItemIds.length > 0) {
    await db
      .delete(costItemInventoryBalances)
      .where(inArray(costItemInventoryBalances.itemId, demoItemIds));
  }

  // 3) Remove demo recipes and children.
  const demoRecipes = await db.query.recipes.findMany({
    where: inArray(recipes.name, DEMO_RECIPE_NAMES),
    columns: { id: true },
  });
  const demoRecipeIds = demoRecipes.map((row) => row.id);
  if (demoRecipeIds.length > 0) {
    await db
      .delete(recipeMaterials)
      .where(inArray(recipeMaterials.recipeId, demoRecipeIds));
    await db
      .delete(recipeCosts)
      .where(inArray(recipeCosts.recipeId, demoRecipeIds));
    await db.delete(recipes).where(inArray(recipes.id, demoRecipeIds));
  }

  // 4) Remove demo product variants and related product tags/products.
  const demoVariants = await db.query.productVariant.findMany({
    where: inArray(productVariant.sku, DEMO_VARIANT_SKUS),
    columns: { id: true, productId: true },
  });

  const demoProductIds = Array.from(
    new Set(demoVariants.map((variant) => variant.productId))
  );
  if (demoProductIds.length > 0) {
    await db
      .delete(productKeywords)
      .where(inArray(productKeywords.productId, demoProductIds));
  }
  if (demoVariants.length > 0) {
    await db.delete(productVariant).where(
      inArray(
        productVariant.id,
        demoVariants.map((variant) => variant.id)
      )
    );
  }

  const demoProducts = await db.query.product.findMany({
    where: inArray(product.name, DEMO_PRODUCT_NAMES),
    columns: { id: true },
  });
  if (demoProducts.length > 0) {
    await db.delete(product).where(
      inArray(
        product.id,
        demoProducts.map((productRow) => productRow.id)
      )
    );
  }

  // 5) Remove seed-generated price rows by source marker.
  await db
    .delete(costItemPrices)
    .where(eq(costItemPrices.sourceNote, DEMO_PRICE_SOURCE_NOTE));

  console.warn("Demo seed reset completed safely.");
};

resetDemoSeed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to reset demo seed data");
    console.error(error);
    process.exit(1);
  });
