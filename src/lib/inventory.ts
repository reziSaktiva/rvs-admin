import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  costItemInventoryBalances,
  costItemInventoryMovements,
  costItemPrices,
  costItems,
  unitConversions,
} from "./db/drizzle/schema";

type UnitSummary = {
  id: string;
  code: string;
  name: string;
  dimension: string;
};

export type RawMaterialAssetItem = {
  itemId: string;
  itemName: string;
  itemType: "raw_material" | "packaging" | "finished_good" | "service";
  qtyOnHand: number;
  unit: UnitSummary;
  avgCostPerUnit: number;
  assetValue: number;
  updatedAt: string | null;
};

export type RawMaterialAssetSummary = {
  totalAssetValue: number;
  items: RawMaterialAssetItem[];
};

export type InventoryMovementOptionItem = {
  id: string;
  name: string;
  defaultUnit: UnitSummary;
};

export type InventoryMovementOptions = {
  items: InventoryMovementOptionItem[];
  movementTypes: StockMovementType[];
};

export type StockMovementType =
  | "opening"
  | "purchase"
  | "production_in"
  | "production_out"
  | "sale_out"
  | "adjustment_in"
  | "adjustment_out"
  | "return_in"
  | "return_out"
  | "transfer_in"
  | "transfer_out";

export type RecordInventoryMovementInput = {
  itemId: string;
  movementType: StockMovementType;
  qtyDelta: number;
  unitId: string;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  note?: string;
  occurredAt?: string;
};

export type RecordInventoryMovementResult = {
  movementId: string;
  itemId: string;
  movementType: StockMovementType;
  qtyDelta: number;
  unitId: string;
  valuation: {
    valueDelta: number;
    unitCostUsed: number;
    previousQtyOnHand: number;
    newQtyOnHand: number;
    previousAvgCostPerUnit: number;
    newAvgCostPerUnit: number;
    previousAssetValue: number;
    newAssetValue: number;
    balanceUnitId: string;
  };
};

export const INVENTORY_MOVEMENT_TYPES: StockMovementType[] = [
  "opening",
  "purchase",
  "production_in",
  "production_out",
  "sale_out",
  "adjustment_in",
  "adjustment_out",
  "return_in",
  "return_out",
  "transfer_in",
  "transfer_out",
];

const EPS = 1e-9;

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

export const getRawMaterialAssetSummary = async (): Promise<RawMaterialAssetSummary> => {
  const balances = await db.query.costItemInventoryBalances.findMany({
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
          id: true,
          code: true,
          name: true,
          dimension: true,
        },
      },
    },
    orderBy: (table, { desc: descOrder }) => [descOrder(table.updatedAt)],
  });

  const items: RawMaterialAssetItem[] = balances
    .filter((balance) => balance.item.isActive)
    .filter(
      (balance) =>
        balance.item.itemType === "raw_material" || balance.item.itemType === "packaging"
    )
    .map((balance) => ({
      itemId: balance.item.id,
      itemName: balance.item.name,
      itemType: balance.item.itemType,
      qtyOnHand: toNumber(balance.qtyOnHand, 0),
      unit: {
        id: balance.unit.id,
        code: balance.unit.code,
        name: balance.unit.name,
        dimension: balance.unit.dimension,
      },
      avgCostPerUnit: toNumber(balance.avgCostPerUnit, 0),
      assetValue: toNumber(balance.assetValue, 0),
      updatedAt: balance.updatedAt ?? null,
    }));

  const totalAssetValue = items.reduce((sum, item) => sum + item.assetValue, 0);
  return { totalAssetValue, items };
};

export const getInventoryMovementOptions = async (): Promise<InventoryMovementOptions> => {
  const items = await db.query.costItems.findMany({
    where: and(
      eq(costItems.isActive, true),
      inArray(costItems.itemType, ["raw_material", "packaging"])
    ),
    with: {
      defaultUnit: {
        columns: {
          id: true,
          code: true,
          name: true,
          dimension: true,
        },
      },
    },
    orderBy: (table) => [asc(table.name)],
  });

  return {
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      defaultUnit: {
        id: item.defaultUnit.id,
        code: item.defaultUnit.code,
        name: item.defaultUnit.name,
        dimension: item.defaultUnit.dimension,
      },
    })),
    movementTypes: INVENTORY_MOVEMENT_TYPES,
  };
};

export const recordInventoryMovement = async (
  input: RecordInventoryMovementInput
): Promise<RecordInventoryMovementResult> => {
  const qtyDelta = toNumber(input.qtyDelta, 0);
  if (Math.abs(qtyDelta) < EPS) {
    throw new Error("qtyDelta must not be zero");
  }

  return db.transaction(async (tx) => {
    const item = await tx.query.costItems.findFirst({
      where: and(eq(costItems.id, input.itemId), eq(costItems.isActive, true)),
      columns: {
        id: true,
        defaultUnitId: true,
      },
    });

    if (!item) {
      throw new Error("Cost item not found or inactive");
    }

    const currentBalance = await tx.query.costItemInventoryBalances.findFirst({
      where: eq(costItemInventoryBalances.itemId, input.itemId),
    });

    const balanceUnitId = currentBalance?.unitId ?? item.defaultUnitId;
    const [conversions, latestPrice] = await Promise.all([
      tx.query.unitConversions.findMany({
        columns: { fromUnitId: true, toUnitId: true, multiplier: true },
      }),
      tx.query.costItemPrices.findFirst({
        where: eq(costItemPrices.itemId, input.itemId),
        orderBy: (table, { desc: descOrder }) => [
          descOrder(table.effectiveFrom),
          descOrder(table.createdAt),
        ],
      }),
    ]);

    const graph = buildConversionGraph(conversions);
    const qtyFactor = findConversionFactor(graph, input.unitId, balanceUnitId);
    if (!qtyFactor || qtyFactor <= 0) {
      throw new Error("No conversion found between movement unit and balance unit");
    }

    const qtyDeltaInBalanceUnit = qtyDelta * qtyFactor;
    const previousQtyOnHand = toNumber(currentBalance?.qtyOnHand, 0);
    const previousAvgCostPerUnit = toNumber(currentBalance?.avgCostPerUnit, 0);
    const previousAssetValue = toNumber(currentBalance?.assetValue, 0);

    let unitCostUsed = 0;
    if (qtyDeltaInBalanceUnit > 0) {
      // Incoming movement should include purchase/opening cost.
      let incomingUnitCostInMovementUnit = toNumber(input.unitCost, NaN);
      if (!Number.isFinite(incomingUnitCostInMovementUnit)) {
        if (!latestPrice) {
          throw new Error("Incoming movement requires unitCost or existing item price");
        }
        const priceFactor = findConversionFactor(graph, latestPrice.unitId, input.unitId);
        if (!priceFactor || priceFactor <= 0) {
          throw new Error("Cannot convert latest item price unit to movement unit");
        }
        incomingUnitCostInMovementUnit = toNumber(latestPrice.pricePerUnit, 0) / priceFactor;
      }

      unitCostUsed = incomingUnitCostInMovementUnit / qtyFactor;
    } else {
      unitCostUsed = previousAvgCostPerUnit;
    }

    let valueDelta = 0;
    if (qtyDeltaInBalanceUnit > 0) {
      valueDelta = qtyDeltaInBalanceUnit * unitCostUsed;
    } else {
      const projectedQty = previousQtyOnHand + qtyDeltaInBalanceUnit;
      if (projectedQty < -EPS) {
        throw new Error("Insufficient stock for outgoing movement");
      }
      valueDelta = qtyDeltaInBalanceUnit * previousAvgCostPerUnit;
    }

    let newQtyOnHand = previousQtyOnHand + qtyDeltaInBalanceUnit;
    if (Math.abs(newQtyOnHand) < EPS) newQtyOnHand = 0;

    let newAssetValue = previousAssetValue + valueDelta;
    if (Math.abs(newAssetValue) < EPS) newAssetValue = 0;

    const newAvgCostPerUnit = newQtyOnHand > EPS ? newAssetValue / newQtyOnHand : 0;
    const now = new Date().toISOString();

    await tx
      .insert(costItemInventoryBalances)
      .values({
        itemId: input.itemId,
        qtyOnHand: String(newQtyOnHand),
        unitId: balanceUnitId,
        avgCostPerUnit: String(newAvgCostPerUnit),
        assetValue: String(newAssetValue),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [costItemInventoryBalances.itemId],
        set: {
          qtyOnHand: String(newQtyOnHand),
          unitId: balanceUnitId,
          avgCostPerUnit: String(newAvgCostPerUnit),
          assetValue: String(newAssetValue),
          updatedAt: now,
        },
      });

    const movementRows = await tx
      .insert(costItemInventoryMovements)
      .values({
        itemId: input.itemId,
        movementType: input.movementType,
        qtyDelta: String(qtyDelta),
        unitId: input.unitId,
        unitCost: String(unitCostUsed * qtyFactor),
        valueDelta: String(valueDelta),
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
        note: input.note ?? null,
        occurredAt: input.occurredAt ?? now,
      })
      .returning({
        id: costItemInventoryMovements.id,
      });

    return {
      movementId: movementRows[0].id,
      itemId: input.itemId,
      movementType: input.movementType,
      qtyDelta,
      unitId: input.unitId,
      valuation: {
        valueDelta,
        unitCostUsed,
        previousQtyOnHand,
        newQtyOnHand,
        previousAvgCostPerUnit,
        newAvgCostPerUnit,
        previousAssetValue,
        newAssetValue,
        balanceUnitId,
      },
    };
  });
};
