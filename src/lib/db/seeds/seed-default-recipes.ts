import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipeCosts, recipeMaterials, recipes } from "@/lib/db/drizzle/schema";

type RecipeMaterialSeed = {
  itemName: string;
  qty: string;
  unitCode: string;
  wastePercent?: string;
  isOptional?: boolean;
  sortOrder: number;
};

type RecipeCostSeed = {
  name: string;
  componentType: "material" | "labor" | "overhead" | "other";
  basis: "per_batch" | "per_unit";
  amount: string;
};

type RecipeSeed = {
  variantSku: string;
  name: string;
  outputQty: string;
  outputUnitCode: string;
  lossPercent: string;
  notes: string;
  materials: RecipeMaterialSeed[];
  costs: RecipeCostSeed[];
};

const defaultRecipes: RecipeSeed[] = [
  {
    variantSku: "SOCK-DOZEN-STD",
    name: "Resep Repack Kaos Kaki Lusin",
    outputQty: "1",
    outputUnitCode: "dozen",
    lossPercent: "0",
    notes: "Repack dari kaos kaki beli jadi ke kemasan lusin.",
    materials: [
      {
        itemName: "Kaos Kaki Polos",
        qty: "12",
        unitCode: "pair",
        sortOrder: 1,
      },
      {
        itemName: "Plastik Kecil Kaos Kaki",
        qty: "12",
        unitCode: "pcs",
        sortOrder: 2,
      },
      {
        itemName: "Label Merek Tempel",
        qty: "12",
        unitCode: "pcs",
        isOptional: true,
        sortOrder: 3,
      },
      {
        itemName: "Plastik Luar Lusin",
        qty: "1",
        unitCode: "pcs",
        sortOrder: 4,
      },
    ],
    costs: [
      {
        name: "Ongkos Packing",
        componentType: "labor",
        basis: "per_batch",
        amount: "1500",
      },
      {
        name: "Overhead Packing",
        componentType: "overhead",
        basis: "per_batch",
        amount: "500",
      },
    ],
  },
  {
    variantSku: "JEANS-BASIC-32",
    name: "Resep Produksi Jeans Internal",
    outputQty: "1",
    outputUnitCode: "pcs",
    lossPercent: "1.5",
    notes: "Produksi internal dari bahan mentah sampai produk jadi.",
    materials: [
      {
        itemName: "Kain Katun",
        qty: "1.8",
        unitCode: "m",
        wastePercent: "5",
        sortOrder: 1,
      },
      {
        itemName: "Benang Jahit",
        qty: "0.08",
        unitCode: "kg",
        wastePercent: "3",
        sortOrder: 2,
      },
      { itemName: "Resleting", qty: "1", unitCode: "pcs", sortOrder: 3 },
      { itemName: "Kancing Baju", qty: "1", unitCode: "pcs", sortOrder: 4 },
    ],
    costs: [
      {
        name: "Tenaga Jahit Internal",
        componentType: "labor",
        basis: "per_unit",
        amount: "35000",
      },
      {
        name: "Overhead Produksi",
        componentType: "overhead",
        basis: "per_unit",
        amount: "12000",
      },
    ],
  },
  {
    variantSku: "SHIRT-BASIC-M",
    name: "Resep Produksi Baju Vendor",
    outputQty: "1",
    outputUnitCode: "pcs",
    lossPercent: "1",
    notes: "Bahan dari sendiri, proses jahit menggunakan vendor.",
    materials: [
      {
        itemName: "Kain Katun",
        qty: "1.5",
        unitCode: "m",
        wastePercent: "4",
        sortOrder: 1,
      },
      {
        itemName: "Benang Jahit",
        qty: "0.05",
        unitCode: "kg",
        wastePercent: "2",
        sortOrder: 2,
      },
      { itemName: "Kancing Baju", qty: "8", unitCode: "pcs", sortOrder: 3 },
      {
        itemName: "Label Merek Tempel",
        qty: "1",
        unitCode: "pcs",
        sortOrder: 4,
      },
      {
        itemName: "Plastik Kecil Kaos Kaki",
        qty: "1",
        unitCode: "pcs",
        sortOrder: 5,
      },
    ],
    costs: [
      {
        name: "Jasa Jahit Vendor",
        componentType: "labor",
        basis: "per_unit",
        amount: "30000",
      },
      {
        name: "Finishing & Packing",
        componentType: "overhead",
        basis: "per_unit",
        amount: "1200",
      },
    ],
  },
];

const seedDefaultRecipes = async () => {
  const [variants, unitRows, itemRows] = await Promise.all([
    db.query.productVariant.findMany({ columns: { id: true, sku: true } }),
    db.query.units.findMany({ columns: { id: true, code: true } }),
    db.query.costItems.findMany({ columns: { id: true, name: true } }),
  ]);

  const variantBySku = new Map(
    variants.map((item) => [item.sku ?? "", item.id])
  );
  const unitByCode = new Map(unitRows.map((item) => [item.code, item.id]));
  const itemByName = new Map(itemRows.map((item) => [item.name, item.id]));

  for (const recipeSeed of defaultRecipes) {
    const productVariantId = variantBySku.get(recipeSeed.variantSku);
    const outputUnitId = unitByCode.get(recipeSeed.outputUnitCode);
    if (!productVariantId) {
      throw new Error(
        `Variant with SKU '${recipeSeed.variantSku}' not found. Run seed:products first.`
      );
    }
    if (!outputUnitId) {
      throw new Error(
        `Unit '${recipeSeed.outputUnitCode}' not found. Run seed:units first.`
      );
    }

    const upsertedRecipe = await db
      .insert(recipes)
      .values({
        productVariantId,
        name: recipeSeed.name,
        outputQty: recipeSeed.outputQty,
        outputUnitId,
        lossPercent: recipeSeed.lossPercent,
        status: "active",
        notes: recipeSeed.notes,
      })
      .onConflictDoUpdate({
        target: [recipes.productVariantId, recipes.name],
        set: {
          outputQty: recipeSeed.outputQty,
          outputUnitId,
          lossPercent: recipeSeed.lossPercent,
          status: "active",
          notes: recipeSeed.notes,
        },
      })
      .returning({ id: recipes.id });

    const recipeId = upsertedRecipe[0].id;

    await db
      .delete(recipeMaterials)
      .where(eq(recipeMaterials.recipeId, recipeId));
    await db.delete(recipeCosts).where(eq(recipeCosts.recipeId, recipeId));

    for (const material of recipeSeed.materials) {
      const itemId = itemByName.get(material.itemName);
      const unitId = unitByCode.get(material.unitCode);
      if (!itemId || !unitId) {
        throw new Error(
          `Missing item/unit for recipe material '${material.itemName}'`
        );
      }

      await db.insert(recipeMaterials).values({
        recipeId,
        itemId,
        qty: material.qty,
        unitId,
        wastePercent: material.wastePercent ?? "0",
        isOptional: material.isOptional ?? false,
        sortOrder: material.sortOrder,
      });
    }

    for (const cost of recipeSeed.costs) {
      await db.insert(recipeCosts).values({
        recipeId,
        name: cost.name,
        componentType: cost.componentType,
        basis: cost.basis,
        amount: cost.amount,
      });
    }
  }

  console.warn(
    `Seed completed: ${defaultRecipes.length} recipes with materials and costs`
  );
};

seedDefaultRecipes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed default recipes");
    console.error(error);
    process.exit(1);
  });
