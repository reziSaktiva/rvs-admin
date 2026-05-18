import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  costItemInventoryBalances,
  costItemPrices,
  recipes,
  unitConversions,
} from "./db/drizzle/schema";

type UnitSummary = {
  id: string;
  code: string;
  name: string;
  dimension: string;
};

type MaterialCostBreakdown = {
  recipeMaterialId: string;
  itemId: string;
  itemName: string;
  qty: number;
  wastePercent: number;
  effectiveQty: number;
  unit: UnitSummary;
  price: {
    itemPriceId: string | null;
    sourceType: "cost_item_price" | "inventory_avg_cost" | "fallback_zero";
    sourceUnit: UnitSummary;
    sourcePricePerUnit: number;
    convertedPricePerUnit: number;
    effectiveFrom: string | null;
    sourceNote: string | null;
  };
  lineCost: number;
};

type AdditionalCostBreakdown = {
  recipeCostId: string;
  name: string;
  componentType: "material" | "labor" | "overhead" | "other";
  basis: "per_batch" | "per_unit";
  amount: number;
  appliedAmount: number;
};

type HppWarning = {
  itemId: string;
  itemName: string;
  code: "missing_price_reference" | "price_unit_conversion_missing";
  message: string;
};

export type CalculateHppResult = {
  recipe: {
    id: string;
    name: string;
    status: "draft" | "active" | "archived";
    productVariantId: string;
    productVariantSku: string | null;
    outputQty: number;
    outputUnit: UnitSummary;
    lossPercent: number;
    effectiveOutputQty: number;
  };
  totals: {
    materialCost: number;
    additionalCost: number;
    totalBatchCost: number;
    hppPerOutputUnit: number;
  };
  materials: MaterialCostBreakdown[];
  additionalCosts: AdditionalCostBreakdown[];
  warnings: HppWarning[];
};

export type HppRecipeOption = {
  recipeId: string;
  recipeName: string;
  status: "draft" | "active" | "archived";
  productName: string;
  variantSku: string | null;
};

const toNumber = (value: string | number | null | undefined, fallback = 0): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const toUnitSummary = (unit: {
  id: string;
  code: string;
  name: string;
  dimension: string;
}): UnitSummary => ({
  id: unit.id,
  code: unit.code,
  name: unit.name,
  dimension: unit.dimension,
});

const buildConversionGraph = (rows: { fromUnitId: string; toUnitId: string; multiplier: string }[]) => {
  const graph = new Map<string, Array<{ to: string; factor: number }>>();

  for (const row of rows) {
    const forwardFactor = toNumber(row.multiplier, 0);
    if (forwardFactor <= 0) continue;

    if (!graph.has(row.fromUnitId)) graph.set(row.fromUnitId, []);
    if (!graph.has(row.toUnitId)) graph.set(row.toUnitId, []);

    graph.get(row.fromUnitId)?.push({ to: row.toUnitId, factor: forwardFactor });
    graph.get(row.toUnitId)?.push({ to: row.fromUnitId, factor: 1 / forwardFactor });
  }

  return graph;
};

const findConversionFactor = (
  graph: Map<string, Array<{ to: string; factor: number }>>,
  fromUnitId: string,
  toUnitId: string
): number | null => {
  if (fromUnitId === toUnitId) return 1;

  const visited = new Set<string>([fromUnitId]);
  const queue: Array<{ unitId: string; factor: number }> = [{ unitId: fromUnitId, factor: 1 }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const neighbors = graph.get(current.unitId) ?? [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor.to)) continue;

      const nextFactor = current.factor * neighbor.factor;
      if (neighbor.to === toUnitId) return nextFactor;

      visited.add(neighbor.to);
      queue.push({ unitId: neighbor.to, factor: nextFactor });
    }
  }

  return null;
};

export const calculateHpp = async (companyId: string, recipeId: string): Promise<CalculateHppResult> => {
  const [recipe, conversions] = await Promise.all([
    db.query.recipes.findFirst({
      where: and(eq(recipes.id, recipeId), eq(recipes.companyId, companyId)),
      with: {
        productVariant: {
          columns: {
            id: true,
            sku: true,
          },
        },
        outputUnit: {
          columns: {
            id: true,
            code: true,
            name: true,
            dimension: true,
          },
        },
        materials: {
          orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.createdAt)],
          with: {
            unit: {
              columns: {
                id: true,
                code: true,
                name: true,
                dimension: true,
              },
            },
            item: {
              columns: {
                id: true,
                name: true,
              },
              with: {
                prices: {
                  where: eq(costItemPrices.companyId, companyId),
                  orderBy: (table, { desc: descOrder }) => [
                    descOrder(table.effectiveFrom),
                    descOrder(table.createdAt),
                  ],
                  with: {
                    unit: {
                      columns: {
                        id: true,
                        code: true,
                        name: true,
                        dimension: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        costs: {
          orderBy: (table, { asc }) => [asc(table.createdAt)],
        },
      },
    }),
    db.query.unitConversions.findMany({
      where: eq(unitConversions.companyId, companyId),
      orderBy: desc(unitConversions.createdAt),
      columns: {
        fromUnitId: true,
        toUnitId: true,
        multiplier: true,
      },
    }),
  ]);

  if (!recipe) {
    throw new Error(`Recipe with id ${recipeId} was not found`);
  }

  const materialItemIds = Array.from(new Set(recipe.materials.map((material) => material.item.id)));
  const balances =
    materialItemIds.length === 0
      ? []
      : await db.query.costItemInventoryBalances.findMany({
        where: and(
          eq(costItemInventoryBalances.companyId, companyId),
          inArray(costItemInventoryBalances.itemId, materialItemIds)
        ),
        columns: {
          itemId: true,
          avgCostPerUnit: true,
        },
        with: {
          unit: {
            columns: {
              id: true,
              code: true,
              name: true,
              dimension: true,
            },
          },
        },
      });

  const outputQty = toNumber(recipe.outputQty, 0);
  const lossPercent = toNumber(recipe.lossPercent, 0);
  const effectiveOutputQty = outputQty * (1 - lossPercent / 100);

  if (effectiveOutputQty <= 0) {
    throw new Error("Effective output quantity must be greater than zero");
  }

  const conversionGraph = buildConversionGraph(
    conversions.map((row) => ({
      fromUnitId: row.fromUnitId,
      toUnitId: row.toUnitId,
      multiplier: String(row.multiplier),
    }))
  );

  const balanceByItemId = new Map(
    balances.map((balance) => [
      balance.itemId,
      {
        avgCostPerUnit: toNumber(balance.avgCostPerUnit, 0),
        unit: toUnitSummary(balance.unit),
      },
    ])
  );

  const warnings: HppWarning[] = [];

  const materials: MaterialCostBreakdown[] = recipe.materials.map((material) => {
    const qty = toNumber(material.qty, 0);
    const wastePercent = toNumber(material.wastePercent, 0);
    const effectiveQty = qty * (1 + wastePercent / 100);

    const priceCandidates = material.item.prices ?? [];
    const newestPrice = priceCandidates[0];
    const selectedPrice = priceCandidates.find((price) => {
      const factor = findConversionFactor(conversionGraph, price.unitId, material.unitId);
      return factor !== null && factor > 0;
    });
    const hasUnconvertibleReferencePrice = priceCandidates.length > 0 && !selectedPrice;

    const balanceFallback = balanceByItemId.get(material.item.id);

    if (selectedPrice) {
      const factor = findConversionFactor(conversionGraph, selectedPrice.unitId, material.unitId);
      if (!factor || factor <= 0) {
        throw new Error(`Unit conversion failed for item ${material.item.name}`);
      }

      // pricePerUnit is based on selectedPrice.unitId.
      // If 1 sourceUnit = factor targetUnit, then price per targetUnit = pricePerSource / factor.
      const sourcePricePerUnit = toNumber(selectedPrice.pricePerUnit, 0);
      const convertedPricePerUnit = sourcePricePerUnit / factor;
      const lineCost = effectiveQty * convertedPricePerUnit;

      return {
        recipeMaterialId: material.id,
        itemId: material.item.id,
        itemName: material.item.name,
        qty,
        wastePercent,
        effectiveQty,
        unit: toUnitSummary(material.unit),
        price: {
          itemPriceId: selectedPrice.id,
          sourceType: "cost_item_price",
          sourceUnit: toUnitSummary(selectedPrice.unit),
          sourcePricePerUnit,
          convertedPricePerUnit,
          effectiveFrom: selectedPrice.effectiveFrom,
          sourceNote: selectedPrice.sourceNote,
        },
        lineCost,
      };
    }

    if (balanceFallback && balanceFallback.avgCostPerUnit > 0) {
      const factor = findConversionFactor(conversionGraph, balanceFallback.unit.id, material.unitId);
      if (factor && factor > 0) {
        const sourcePricePerUnit = balanceFallback.avgCostPerUnit;
        const convertedPricePerUnit = sourcePricePerUnit / factor;
        const lineCost = effectiveQty * convertedPricePerUnit;

        warnings.push({
          itemId: material.item.id,
          itemName: material.item.name,
          code: hasUnconvertibleReferencePrice
            ? "price_unit_conversion_missing"
            : "missing_price_reference",
          message: hasUnconvertibleReferencePrice
            ? `${material.item.name}: harga acuan ada, tapi satuan ${newestPrice?.unit.code ?? "?"} tidak bisa dikonversi ke ${material.unit.code}. Sementara memakai rata-rata biaya stok.`
            : `${material.item.name}: harga acuan belum ada, memakai rata-rata biaya stok.`,
        });

        return {
          recipeMaterialId: material.id,
          itemId: material.item.id,
          itemName: material.item.name,
          qty,
          wastePercent,
          effectiveQty,
          unit: toUnitSummary(material.unit),
          price: {
            itemPriceId: null,
            sourceType: "inventory_avg_cost",
            sourceUnit: balanceFallback.unit,
            sourcePricePerUnit,
            convertedPricePerUnit,
            effectiveFrom: null,
            sourceNote: "fallback:inventory_avg_cost",
          },
          lineCost,
        };
      }
    }

    warnings.push({
      itemId: material.item.id,
      itemName: material.item.name,
      code: hasUnconvertibleReferencePrice ? "price_unit_conversion_missing" : "missing_price_reference",
      message: hasUnconvertibleReferencePrice
        ? `${material.item.name}: harga acuan ada, tapi satuan ${newestPrice?.unit.code ?? "?"} tidak bisa dikonversi ke ${material.unit.code}. Sementara dihitung Rp0.`
        : `${material.item.name}: harga acuan belum ada, sementara dihitung Rp0. Lengkapi harga bahan agar HPP akurat.`,
    });

    const convertedPricePerUnit = 0;
    const lineCost = effectiveQty * convertedPricePerUnit;

    return {
      recipeMaterialId: material.id,
      itemId: material.item.id,
      itemName: material.item.name,
      qty,
      wastePercent,
      effectiveQty,
      unit: toUnitSummary(material.unit),
      price: {
        itemPriceId: null,
        sourceType: "fallback_zero",
        sourceUnit: toUnitSummary(material.unit),
        sourcePricePerUnit: 0,
        convertedPricePerUnit,
        effectiveFrom: null,
        sourceNote: "fallback:zero",
      },
      lineCost,
    };
  });

  const additionalCosts: AdditionalCostBreakdown[] = recipe.costs.map((cost) => {
    const amount = toNumber(cost.amount, 0);
    const appliedAmount = cost.basis === "per_unit" ? amount * effectiveOutputQty : amount;

    return {
      recipeCostId: cost.id,
      name: cost.name,
      componentType: cost.componentType,
      basis: cost.basis,
      amount,
      appliedAmount,
    };
  });

  const materialCost = materials.reduce((sum, item) => sum + item.lineCost, 0);
  const additionalCost = additionalCosts.reduce((sum, item) => sum + item.appliedAmount, 0);
  const totalBatchCost = materialCost + additionalCost;
  const hppPerOutputUnit = totalBatchCost / effectiveOutputQty;

  return {
    recipe: {
      id: recipe.id,
      name: recipe.name,
      status: recipe.status,
      productVariantId: recipe.productVariantId,
      productVariantSku: recipe.productVariant?.sku ?? null,
      outputQty,
      outputUnit: toUnitSummary(recipe.outputUnit),
      lossPercent,
      effectiveOutputQty,
    },
    totals: {
      materialCost,
      additionalCost,
      totalBatchCost,
      hppPerOutputUnit,
    },
    materials,
    additionalCosts,
    warnings,
  };
};

export const getHppRecipeOptions = async (companyId: string): Promise<HppRecipeOption[]> => {
  const rows = await db.query.recipes.findMany({
    where: eq(recipes.companyId, companyId),
    with: {
      productVariant: {
        columns: {
          sku: true,
        },
        with: {
          product: {
            columns: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: (table) => [asc(table.name), asc(table.createdAt)],
  });

  return rows.map((row) => ({
    recipeId: row.id,
    recipeName: row.name,
    status: row.status,
    productName: row.productVariant.product.name,
    variantSku: row.productVariant.sku ?? null,
  }));
};
