import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  categories as categoriesTable,
  companyMembers,
  costItems,
  product,
  productVariant,
  profiles,
  recipes,
  units,
} from "@/lib/db/drizzle/schema";
import { getCurrentUserActiveCompanyContext } from "@/lib/company/active-company";
import type { RecipeStatus } from "./components/view-model";

type ResepProduksiPaginationInput = {
  page: number;
  pageSize: number;
};

export async function getResepProduksiPageData(
  companyId: string,
  selectedStatus: RecipeStatus | undefined,
  pagination: ResepProduksiPaginationInput
) {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;
  const [recipeRows, availableItems, availableUnits, categories, products, allVariants] = await Promise.all([
    db.query.recipes.findMany({
      where: selectedStatus
        ? and(eq(recipes.companyId, companyId), eq(recipes.status, selectedStatus))
        : eq(recipes.companyId, companyId),
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
      where: and(eq(costItems.companyId, companyId), eq(costItems.isActive, true)),
      orderBy: (table) => [asc(table.name)],
    }),
    db.query.units.findMany({
      columns: {
        id: true,
        code: true,
        dimension: true,
      },
      where: eq(units.companyId, companyId),
      orderBy: (table) => [asc(table.code)],
    }),
    db.query.categories.findMany({
      columns: {
        id: true,
        name: true,
      },
      where: eq(categoriesTable.companyId, companyId),
      orderBy: (table) => [asc(table.name)],
    }),
    db.query.product.findMany({
      columns: {
        id: true,
        name: true,
      },
      where: eq(product.companyId, companyId),
      orderBy: (table) => [asc(table.name)],
    }),
    db.query.productVariant.findMany({
      columns: {
        id: true,
        sku: true,
        size: true,
        isActive: true,
      },
      where: eq(productVariant.companyId, companyId),
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

export async function getResepProduksiRecipeDetailData(recipeId: string) {
  const activeContext = await getCurrentUserActiveCompanyContext();
  if (!activeContext) {
    return {
      recipe: null,
      availableItems: [],
      availableUnits: [],
      access: {
        canManage: false,
        canManageByRole: false,
        canManageByStatus: false,
        roleName: null,
      },
    };
  }

  const [recipe, availableItems, availableUnits, profile] = await Promise.all([
    db.query.recipes.findFirst({
      where: and(eq(recipes.id, recipeId), eq(recipes.companyId, activeContext.companyId)),
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
    }),
    db.query.costItems.findMany({
      columns: {
        id: true,
        name: true,
        itemType: true,
      },
      where: and(
        eq(costItems.companyId, activeContext.companyId),
        eq(costItems.isActive, true)
      ),
      orderBy: (table) => [asc(table.name)],
    }),
    db.query.units.findMany({
      columns: {
        id: true,
        code: true,
        dimension: true,
      },
      where: eq(units.companyId, activeContext.companyId),
      orderBy: (table) => [asc(table.code)],
    }),
    db.query.profiles.findFirst({
      where: eq(profiles.id, activeContext.userId),
      with: {
        companyMemberships: {
          where: eq(companyMembers.companyId, activeContext.companyId),
          with: {
            role: {
              columns: {
                title: true,
                displayName: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const membership = profile?.companyMemberships?.[0];
  const roleTitle = (membership?.role?.title ?? "").toLowerCase();
  const isReadOnlyRole =
    roleTitle.includes("viewer") ||
    roleTitle.includes("read") ||
    roleTitle.includes("kasir") ||
    roleTitle.includes("operator");
  const canManageByRole = !!membership?.role && !isReadOnlyRole;
  const canManageByStatus = recipe ? recipe.status !== "archived" : false;
  const canManage = canManageByRole && canManageByStatus;

  return {
    recipe,
    availableItems,
    availableUnits,
    access: {
      canManage,
      canManageByRole,
      canManageByStatus,
      roleName: membership?.role?.displayName ?? membership?.role?.title ?? null,
    },
  };
}
