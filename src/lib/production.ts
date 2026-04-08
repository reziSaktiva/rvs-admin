import { desc, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  costItemInventoryBalances,
  costItemInventoryMovements,
  productVariant,
  recipes,
  unitConversions,
} from "./db/drizzle/schema";

export type ProductionRecipeOption = {
  recipeId: string;
  recipeName: string;
  status: "draft" | "active" | "archived";
  productName: string;
  productVariantId: string;
  variantSku: string | null;
  outputQty: number;
  outputUnitCode: string;
  lossPercent: number;
};

type MaterialRequirement = {
  recipeMaterialId: string;
  itemId: string;
  itemName: string;
  requiredQty: number;
  unitId: string;
  unitCode: string;
  availableQty: number;
  shortfallQty: number;
  isSufficient: boolean;
};

export type ProductionPreview = {
  recipe: ProductionRecipeOption;
  batchCount: number;
  producedQtyRaw: number;
  producedQtyEffective: number;
  producedQtyForStock: number;
  canPost: boolean;
  materials: MaterialRequirement[];
};

export type PostProductionInput = {
  recipeId: string;
  batchCount: number;
  note?: string;
};

export type PostProductionResult = {
  runId: string;
  recipeId: string;
  batchCount: number;
  producedQtyForStock: number;
  materialMovementsCount: number;
};

export type ProductionRunHistoryItem = {
  runId: string;
  occurredAt: string | null;
  batchCount: number | null;
  producedQtyForStock: number | null;
  note: string | null;
  materialLines: number;
  totalConsumedValue: number;
  materials: Array<{
    itemName: string;
    qtyDelta: number;
    unitCode: string;
  }>;
};

type UnitSummary = {
  id: string;
  code: string;
};

const toNumber = (value: string | number | null | undefined, fallback = 0): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const buildConversionGraph = (
  rows: Array<{ fromUnitId: string; toUnitId: string; multiplier: string | number }>
) => {
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

const computePreviewFromRecipeData = (
  recipe: any,
  conversions: Array<{ fromUnitId: string; toUnitId: string; multiplier: string | number }>,
  balanceByItemId: Map<string, { qtyOnHand: number; unit: UnitSummary }>,
  batchCountInput: number
): ProductionPreview => {
  if (!recipe) {
    throw new Error("Recipe not found");
  }

  const batchCount = Math.max(0, batchCountInput);
  if (!Number.isFinite(batchCount) || batchCount <= 0) {
    throw new Error("batchCount must be greater than 0");
  }

  const graph = buildConversionGraph(conversions);
  const outputQty = toNumber(recipe.outputQty, 0);
  const lossPercent = toNumber(recipe.lossPercent, 0);
  const producedQtyRaw = outputQty * batchCount;
  const producedQtyEffective = producedQtyRaw * (1 - lossPercent / 100);
  const producedQtyForStock = Math.max(0, Math.round(producedQtyEffective));

  const materials: MaterialRequirement[] = recipe.materials.map((material: any) => {
    const qty = toNumber(material.qty, 0);
    const wastePercent = toNumber(material.wastePercent, 0);
    const requiredQty = qty * (1 + wastePercent / 100) * batchCount;

    const balance = balanceByItemId.get(material.itemId);
    let availableQty = 0;
    if (balance) {
      const factor = findConversionFactor(graph, balance.unit.id, material.unit.id);
      availableQty = factor ? balance.qtyOnHand * factor : 0;
    }
    const shortfallQty = Math.max(0, requiredQty - availableQty);

    return {
      recipeMaterialId: material.id,
      itemId: material.item.id,
      itemName: material.item.name,
      requiredQty,
      unitId: material.unit.id,
      unitCode: material.unit.code,
      availableQty,
      shortfallQty,
      isSufficient: shortfallQty <= 0,
    };
  });

  return {
    recipe: {
      recipeId: recipe.id,
      recipeName: recipe.name,
      status: recipe.status,
      productName: recipe.productVariant.product.name,
      productVariantId: recipe.productVariant.id,
      variantSku: recipe.productVariant.sku ?? null,
      outputQty,
      outputUnitCode: recipe.outputUnit.code,
      lossPercent,
    },
    batchCount,
    producedQtyRaw,
    producedQtyEffective,
    producedQtyForStock,
    canPost: materials.every((item) => item.isSufficient),
    materials,
  };
};

export const getProductionRecipeOptions = async (): Promise<ProductionRecipeOption[]> => {
  const rows = await db.query.recipes.findMany({
    with: {
      productVariant: {
        columns: {
          id: true,
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
      outputUnit: {
        columns: {
          code: true,
        },
      },
    },
    orderBy: (table, { desc: descOrder }) => [descOrder(table.updatedAt)],
  });

  return rows.map((row) => ({
    recipeId: row.id,
    recipeName: row.name,
    status: row.status,
    productName: row.productVariant.product.name,
    productVariantId: row.productVariant.id,
    variantSku: row.productVariant.sku ?? null,
    outputQty: toNumber(row.outputQty, 0),
    outputUnitCode: row.outputUnit.code,
    lossPercent: toNumber(row.lossPercent, 0),
  }));
};

const getBalancesByItemId = async () => {
  const balances = await db.query.costItemInventoryBalances.findMany({
    with: {
      unit: {
        columns: {
          id: true,
          code: true,
        },
      },
    },
  });

  return new Map(
    balances.map((balance) => [
      balance.itemId,
      {
        qtyOnHand: toNumber(balance.qtyOnHand, 0),
        unit: {
          id: balance.unit.id,
          code: balance.unit.code,
        } satisfies UnitSummary,
      },
    ])
  );
};

export const previewProductionPost = async (
  recipeId: string,
  batchCountInput: number
): Promise<ProductionPreview> => {
  const [recipe, conversions, balanceByItemId] = await Promise.all([
    db.query.recipes.findFirst({
      where: eq(recipes.id, recipeId),
      with: {
        productVariant: {
          columns: {
            id: true,
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
        outputUnit: {
          columns: {
            id: true,
            code: true,
          },
        },
        materials: {
          with: {
            item: {
              columns: {
                id: true,
                name: true,
                defaultUnitId: true,
              },
            },
            unit: {
              columns: {
                id: true,
                code: true,
              },
            },
          },
          orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.createdAt)],
        },
      },
    }),
    db.query.unitConversions.findMany({
      orderBy: desc(unitConversions.createdAt),
      columns: {
        fromUnitId: true,
        toUnitId: true,
        multiplier: true,
      },
    }),
    getBalancesByItemId(),
  ]);

  if (!recipe) throw new Error(`Recipe ${recipeId} not found`);

  return computePreviewFromRecipeData(recipe, conversions, balanceByItemId, batchCountInput);
};

export const postProductionRun = async (input: PostProductionInput): Promise<PostProductionResult> => {
  return db.transaction(async (tx) => {
    const [recipe, conversions] = await Promise.all([
      tx.query.recipes.findFirst({
        where: eq(recipes.id, input.recipeId),
        with: {
          productVariant: {
            columns: {
              id: true,
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
          outputUnit: {
            columns: {
              id: true,
              code: true,
            },
          },
          materials: {
            with: {
              item: {
                columns: {
                  id: true,
                  name: true,
                  defaultUnitId: true,
                },
              },
              unit: {
                columns: {
                  id: true,
                  code: true,
                },
              },
            },
            orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.createdAt)],
          },
        },
      }),
      tx.query.unitConversions.findMany({
        orderBy: desc(unitConversions.createdAt),
        columns: {
          fromUnitId: true,
          toUnitId: true,
          multiplier: true,
        },
      }),
    ]);

    if (!recipe) {
      throw new Error(`Recipe ${input.recipeId} not found`);
    }

    const itemIds = recipe.materials.map((material) => material.itemId);
    const balances = itemIds.length
      ? await tx.query.costItemInventoryBalances.findMany({
          where: inArray(costItemInventoryBalances.itemId, itemIds),
          columns: {
            itemId: true,
            qtyOnHand: true,
            unitId: true,
            avgCostPerUnit: true,
            assetValue: true,
          },
        })
      : [];

    const balanceByItemId = new Map(
      balances.map((balance) => [
        balance.itemId,
        {
          qtyOnHand: toNumber(balance.qtyOnHand, 0),
          unit: {
            id: balance.unitId,
            code: balance.unitId,
          } satisfies UnitSummary,
        },
      ])
    );

    const preview = computePreviewFromRecipeData(recipe, conversions, balanceByItemId, input.batchCount);
    if (!preview.canPost) {
      throw new Error("Insufficient materials to post production");
    }

    const runId = `PRD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const occurredAt = new Date().toISOString();
    const runMetaNote = JSON.stringify({
      batchCount: preview.batchCount,
      producedQtyForStock: preview.producedQtyForStock,
      note: input.note?.trim() || "",
    });
    const graph = buildConversionGraph(conversions);

    for (const material of preview.materials) {
      const rawBalance = balances.find((item) => item.itemId === material.itemId);
      if (!rawBalance) {
        throw new Error(`No balance record for material ${material.itemName}`);
      }

      const balanceUnitId = rawBalance.unitId;
      const qtyFactor = findConversionFactor(graph, material.unitId, balanceUnitId);
      if (!qtyFactor || qtyFactor <= 0) {
        throw new Error(`No unit conversion found for material ${material.itemName}`);
      }

      const qtyDeltaInMovementUnit = -material.requiredQty;
      const qtyDeltaInBalanceUnit = qtyDeltaInMovementUnit * qtyFactor;

      const previousQtyOnHand = toNumber(rawBalance.qtyOnHand, 0);
      const previousAvgCostPerUnit = toNumber(rawBalance.avgCostPerUnit, 0);
      const previousAssetValue = toNumber(rawBalance.assetValue, 0);
      const projectedQty = previousQtyOnHand + qtyDeltaInBalanceUnit;
      if (projectedQty < 0) {
        throw new Error(`Insufficient stock for material ${material.itemName}`);
      }

      const valueDelta = qtyDeltaInBalanceUnit * previousAvgCostPerUnit;
      const newQtyOnHand = projectedQty;
      const newAssetValue = previousAssetValue + valueDelta;
      const newAvgCostPerUnit = newQtyOnHand > 0 ? newAssetValue / newQtyOnHand : 0;

      await tx
        .update(costItemInventoryBalances)
        .set({
          qtyOnHand: String(newQtyOnHand),
          avgCostPerUnit: String(newAvgCostPerUnit),
          assetValue: String(newAssetValue),
          updatedAt: occurredAt,
        })
        .where(eq(costItemInventoryBalances.itemId, material.itemId));

      const unitCostPerMovementUnit = previousAvgCostPerUnit * qtyFactor;
      await tx.insert(costItemInventoryMovements).values({
        itemId: material.itemId,
        movementType: "production_out",
        qtyDelta: String(qtyDeltaInMovementUnit),
        unitId: material.unitId,
        unitCost: String(unitCostPerMovementUnit),
        valueDelta: String(valueDelta),
        referenceType: "production_run",
        referenceId: runId,
        note: runMetaNote,
        occurredAt,
      });
    }

    const currentVariant = await tx.query.productVariant.findFirst({
      where: eq(productVariant.id, preview.recipe.productVariantId),
      columns: {
        id: true,
        stock: true,
      },
    });

    if (!currentVariant) {
      throw new Error("Product variant not found for production posting");
    }

    await tx
      .update(productVariant)
      .set({
        stock: (currentVariant.stock ?? 0) + preview.producedQtyForStock,
        updatedAt: occurredAt,
      })
      .where(eq(productVariant.id, currentVariant.id));

    return {
      runId,
      recipeId: input.recipeId,
      batchCount: preview.batchCount,
      producedQtyForStock: preview.producedQtyForStock,
      materialMovementsCount: preview.materials.length,
    };
  });
};

export const getProductionRunHistory = async (limit = 30): Promise<ProductionRunHistoryItem[]> => {
  const rows = await db.query.costItemInventoryMovements.findMany({
    where: (table, { eq: eqOp }) => eqOp(table.referenceType, "production_run"),
    with: {
      item: {
        columns: {
          name: true,
        },
      },
      unit: {
        columns: {
          code: true,
        },
      },
    },
    orderBy: (table, { desc: descOrder }) => [descOrder(table.occurredAt), descOrder(table.createdAt)],
    limit,
  });

  const grouped = new Map<string, ProductionRunHistoryItem>();
  for (const row of rows) {
    const runId = row.referenceId ?? "-";
    if (!grouped.has(runId)) {
      let batchCount: number | null = null;
      let producedQtyForStock: number | null = null;
      let note: string | null = null;
      if (row.note) {
        try {
          const parsed = JSON.parse(row.note) as {
            batchCount?: number;
            producedQtyForStock?: number;
            note?: string;
          };
          batchCount = Number.isFinite(parsed.batchCount) ? Number(parsed.batchCount) : null;
          producedQtyForStock = Number.isFinite(parsed.producedQtyForStock)
            ? Number(parsed.producedQtyForStock)
            : null;
          note = parsed.note ?? null;
        } catch {
          note = row.note;
        }
      }

      grouped.set(runId, {
        runId,
        occurredAt: row.occurredAt ?? null,
        batchCount,
        producedQtyForStock,
        note,
        materialLines: 0,
        totalConsumedValue: 0,
        materials: [],
      });
    }

    const run = grouped.get(runId)!;
    run.materialLines += 1;
    run.totalConsumedValue += Math.abs(toNumber(row.valueDelta, 0));
    run.materials.push({
      itemName: row.item.name,
      qtyDelta: toNumber(row.qtyDelta, 0),
      unitCode: row.unit.code,
    });
  }

  return Array.from(grouped.values()).slice(0, limit);
};
