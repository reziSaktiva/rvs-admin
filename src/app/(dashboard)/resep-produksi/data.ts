import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import type { RecipeStatus } from "./components/view-model";

export async function getResepProduksiPageData(selectedStatus?: RecipeStatus) {
  const [recipeRows, availableItems, availableUnits, categories, products, allVariants] = await Promise.all([
    db.query.recipes.findMany({
      where: selectedStatus ? (table) => eq(table.status, selectedStatus) : undefined,
      with: {
        productVariant: {
          columns: {
            id: true,
            sku: true,
            size: true,
            barcode: true,
            price: true,
            stock: true,
            isActive: true,
          },
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                description: true,
                isActive: true,
                categoryId: true,
              },
            },
          },
        },
        outputUnit: {
          columns: {
            id: true,
            code: true,
          },
        },
        materials: {
          columns: {
            id: true,
            qty: true,
            wastePercent: true,
            sortOrder: true,
            isOptional: true,
          },
          with: {
            item: {
              columns: {
                id: true,
                name: true,
              },
            },
            unit: {
              columns: {
                id: true,
                code: true,
              },
            },
          },
          orderBy: (table, { asc: ascOrder }) => [ascOrder(table.sortOrder), ascOrder(table.createdAt)],
        },
        costs: {
          columns: {
            id: true,
            name: true,
            componentType: true,
            basis: true,
            amount: true,
          },
          orderBy: (table, { asc: ascOrder }) => [ascOrder(table.createdAt)],
        },
      },
      orderBy: (table) => [desc(table.updatedAt)],
    }),
    db.query.costItems.findMany({
      columns: {
        id: true,
        name: true,
        itemType: true,
      },
      where: (table, { eq: eqOp }) => eqOp(table.isActive, true),
      orderBy: (table) => [asc(table.name)],
    }),
    db.query.units.findMany({
      columns: {
        id: true,
        code: true,
        dimension: true,
      },
      orderBy: (table) => [asc(table.code)],
    }),
    db.query.categories.findMany({
      columns: {
        id: true,
        name: true,
      },
      orderBy: (table) => [asc(table.name)],
    }),
    db.query.product.findMany({
      columns: {
        id: true,
        name: true,
      },
      orderBy: (table) => [asc(table.name)],
    }),
    db.query.productVariant.findMany({
      columns: {
        id: true,
        sku: true,
        size: true,
        isActive: true,
      },
      with: {
        product: {
          columns: {
            name: true,
          },
        },
      },
      orderBy: (table) => [asc(table.createdAt)],
    }),
  ]);

  return { recipeRows, availableItems, availableUnits, categories, products, allVariants };
}

export type ResepProduksiPageData = Awaited<ReturnType<typeof getResepProduksiPageData>>;
export type RecipeRow = ResepProduksiPageData["recipeRows"][number];
