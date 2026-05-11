import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import type { RecipeStatus } from "./components/view-model";

type ResepProduksiPaginationInput = {
  page: number;
  pageSize: number;
};

export async function getResepProduksiPageData(
  selectedStatus: RecipeStatus | undefined,
  pagination: ResepProduksiPaginationInput
) {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;
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
              with: {
                prices: {
                  columns: {
                    id: true,
                    unitId: true,
                    pricePerUnit: true,
                    effectiveFrom: true,
                    createdAt: true,
                  },
                  with: {
                    unit: {
                      columns: {
                        code: true,
                      },
                    },
                  },
                  orderBy: (table, { desc: descOrder }) => [
                    descOrder(table.effectiveFrom),
                    descOrder(table.createdAt),
                  ],
                  limit: 5,
                },
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
      limit: pageSize + 1,
      offset,
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
  const hasNextPage = recipeRows.length > pageSize;
  const pagedRecipeRows = hasNextPage ? recipeRows.slice(0, pageSize) : recipeRows;

  return {
    recipeRows: pagedRecipeRows,
    availableItems,
    availableUnits,
    categories,
    products,
    allVariants,
    hasNextPage,
  };
}

export type ResepProduksiPageData = Awaited<ReturnType<typeof getResepProduksiPageData>>;
export type RecipeRow = ResepProduksiPageData["recipeRows"][number];
