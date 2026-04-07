import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  costItemInventoryBalances,
  costItemInventoryMovements,
  costItems,
  units,
} from "@/lib/db/drizzle/schema";

type OpeningInventorySeed = {
  itemName: string;
  unitCode: string;
  qtyOnHand: string;
  avgCostPerUnit: string;
};

const openingInventoryRows: OpeningInventorySeed[] = [
  {
    itemName: "Kaos Kaki Polos",
    unitCode: "pair",
    qtyOnHand: "1500",
    avgCostPerUnit: "3500",
  },
  {
    itemName: "Plastik Kecil Kaos Kaki",
    unitCode: "pcs",
    qtyOnHand: "5000",
    avgCostPerUnit: "120",
  },
  {
    itemName: "Label Merek Tempel",
    unitCode: "pcs",
    qtyOnHand: "3500",
    avgCostPerUnit: "80",
  },
  {
    itemName: "Plastik Luar Lusin",
    unitCode: "pcs",
    qtyOnHand: "1000",
    avgCostPerUnit: "450",
  },
  {
    itemName: "Benang Jahit",
    unitCode: "kg",
    qtyOnHand: "15",
    avgCostPerUnit: "65000",
  },
  {
    itemName: "Kain Katun",
    unitCode: "m",
    qtyOnHand: "500",
    avgCostPerUnit: "28000",
  },
  {
    itemName: "Kancing Baju",
    unitCode: "pcs",
    qtyOnHand: "2000",
    avgCostPerUnit: "250",
  },
  {
    itemName: "Resleting",
    unitCode: "pcs",
    qtyOnHand: "700",
    avgCostPerUnit: "1800",
  },
];

const seedOpeningInventory = async () => {
  const [itemRows, unitRows] = await Promise.all([
    db.query.costItems.findMany({ columns: { id: true, name: true } }),
    db.query.units.findMany({ columns: { id: true, code: true } }),
  ]);

  const itemByName = new Map(itemRows.map((item) => [item.name, item.id]));
  const unitByCode = new Map(unitRows.map((item) => [item.code, item.id]));
  const referenceType = "seed_opening_inventory_v1";
  const now = new Date().toISOString();

  for (const row of openingInventoryRows) {
    const itemId = itemByName.get(row.itemName);
    const unitId = unitByCode.get(row.unitCode);
    if (!itemId || !unitId) {
      throw new Error(
        `Missing item/unit for opening inventory '${row.itemName}'`
      );
    }

    const assetValue = String(
      Number(row.qtyOnHand) * Number(row.avgCostPerUnit)
    );

    await db
      .insert(costItemInventoryBalances)
      .values({
        itemId,
        qtyOnHand: row.qtyOnHand,
        unitId,
        avgCostPerUnit: row.avgCostPerUnit,
        assetValue,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [costItemInventoryBalances.itemId],
        set: {
          qtyOnHand: row.qtyOnHand,
          unitId,
          avgCostPerUnit: row.avgCostPerUnit,
          assetValue,
          updatedAt: now,
        },
      });

    const existingOpeningMovement =
      await db.query.costItemInventoryMovements.findFirst({
        where: and(
          eq(costItemInventoryMovements.itemId, itemId),
          eq(costItemInventoryMovements.referenceType, referenceType)
        ),
        columns: { id: true },
      });

    if (!existingOpeningMovement) {
      await db.insert(costItemInventoryMovements).values({
        itemId,
        movementType: "opening",
        qtyDelta: row.qtyOnHand,
        unitId,
        unitCost: row.avgCostPerUnit,
        valueDelta: assetValue,
        referenceType,
        referenceId: itemId,
        note: "Seed opening inventory",
        occurredAt: now,
      });
    }
  }

  console.warn(
    `Seed completed: ${openingInventoryRows.length} opening inventory rows`
  );
};

seedOpeningInventory()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed opening inventory");
    console.error(error);
    process.exit(1);
  });
