import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { calculateHpp } from "./hpp";
import { costItems } from "./db/drizzle/schema";

type TopAssetItem = {
  itemId: string;
  itemName: string;
  qtyOnHand: number;
  unitCode: string;
  assetValue: number;
};

type MaterialCostTrendItem = {
  itemId: string;
  itemName: string;
  unitCode: string;
  latestPrice: number;
  previousPrice: number | null;
  deltaValue: number | null;
  deltaPercent: number | null;
};

type ProductMarginItem = {
  productVariantId: string;
  productName: string;
  variantSku: string | null;
  sellingPrice: number;
  hppPerUnit: number;
  marginValue: number;
  marginPercent: number;
  recipeName: string;
};

export type DashboardAnalyticsSummary = {
  topAssetItems: TopAssetItem[];
  materialCostTrends: MaterialCostTrendItem[];
  highestMargins: ProductMarginItem[];
  lowestMargins: ProductMarginItem[];
};

const toNumber = (value: string | number | null | undefined, fallback = 0): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

export const getDashboardAnalyticsSummary = async (): Promise<DashboardAnalyticsSummary> => {
  const topAssetRows = await db.query.costItemInventoryBalances.findMany({
    with: {
      item: {
        columns: {
          id: true,
          name: true,
          itemType: true,
          isActive: true,
        },
      },
      unit: {
        columns: {
          code: true,
        },
      },
    },
    orderBy: (table, { desc: descOrder }) => [descOrder(table.assetValue), descOrder(table.updatedAt)],
    limit: 20,
  });

  const topAssetItems = topAssetRows
    .filter((row) => row.item.isActive)
    .filter((row) => row.item.itemType === "raw_material" || row.item.itemType === "packaging")
    .map((row) => ({
      itemId: row.item.id,
      itemName: row.item.name,
      qtyOnHand: toNumber(row.qtyOnHand, 0),
      unitCode: row.unit.code,
      assetValue: toNumber(row.assetValue, 0),
    }))
    .sort((a, b) => b.assetValue - a.assetValue)
    .slice(0, 5);

  const materialItems = await db.query.costItems.findMany({
    where: inArray(costItems.itemType, ["raw_material", "packaging"]),
    columns: {
      id: true,
      name: true,
    },
    with: {
      prices: {
        orderBy: (table, { desc: descOrder }) => [
          descOrder(table.effectiveFrom),
          descOrder(table.createdAt),
        ],
        with: {
          unit: {
            columns: {
              code: true,
            },
          },
        },
      },
    },
    orderBy: (table) => [asc(table.name)],
  });

  const materialCostTrends = materialItems
    .map((item) => {
      const latest = item.prices[0];
      const previous = item.prices[1];
      if (!latest) return null;

      const latestPrice = toNumber(latest.pricePerUnit, 0);
      const previousPrice = previous ? toNumber(previous.pricePerUnit, 0) : null;
      const deltaValue = previousPrice === null ? null : latestPrice - previousPrice;
      const deltaPercent =
        previousPrice === null || previousPrice === 0 ? null : (deltaValue! / previousPrice) * 100;

      return {
        itemId: item.id,
        itemName: item.name,
        unitCode: latest.unit.code,
        latestPrice,
        previousPrice,
        deltaValue,
        deltaPercent,
      } satisfies MaterialCostTrendItem;
    })
    .filter((item): item is MaterialCostTrendItem => item !== null)
    .sort((a, b) => Math.abs(b.deltaPercent ?? 0) - Math.abs(a.deltaPercent ?? 0))
    .slice(0, 5);

  const variants = await db.query.productVariant.findMany({
    columns: {
      id: true,
      sku: true,
      price: true,
      isActive: true,
    },
    with: {
      product: {
        columns: {
          name: true,
          isActive: true,
        },
      },
      recipes: {
        columns: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });

  const marginRows: ProductMarginItem[] = [];
  for (const variant of variants) {
    if (!variant.isActive || !variant.product.isActive) continue;

    const selectedRecipe =
      variant.recipes.find((recipe) => recipe.status === "active") ?? variant.recipes[0];
    if (!selectedRecipe) continue;

    try {
      const hpp = await calculateHpp(selectedRecipe.id);
      const sellingPrice = toNumber(variant.price, 0);
      if (sellingPrice <= 0) continue;

      const marginValue = sellingPrice - hpp.totals.hppPerOutputUnit;
      const marginPercent = (marginValue / sellingPrice) * 100;

      marginRows.push({
        productVariantId: variant.id,
        productName: variant.product.name,
        variantSku: variant.sku ?? null,
        sellingPrice,
        hppPerUnit: hpp.totals.hppPerOutputUnit,
        marginValue,
        marginPercent,
        recipeName: selectedRecipe.name,
      });
    } catch {
      // Skip variants that cannot be calculated yet.
    }
  }

  const sortedMarginRows = [...marginRows].sort((a, b) => b.marginPercent - a.marginPercent);
  const highestMargins = sortedMarginRows.slice(0, 3);
  const lowestMargins = [...sortedMarginRows].reverse().slice(0, 3);

  return {
    topAssetItems,
    materialCostTrends,
    highestMargins,
    lowestMargins,
  };
};
