import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { costItemPrices, costItems } from "@/lib/db/drizzle/schema";

type DefaultCostItem = {
  name: string;
  sku: string;
  itemType: "raw_material" | "packaging" | "finished_good" | "service";
  defaultUnitCode: string;
};

type DefaultCostItemPrice = {
  itemName: string;
  unitCode: string;
  pricePerUnit: string;
  sourceNote: string;
};

const defaultCostItems: DefaultCostItem[] = [
  // Sock trading + repackaging examples
  {
    name: "Kaos Kaki Polos",
    sku: "RM-SOCK-PLAIN",
    itemType: "finished_good",
    defaultUnitCode: "pair",
  },
  {
    name: "Plastik Kecil Kaos Kaki",
    sku: "PK-SOCK-SMALL",
    itemType: "packaging",
    defaultUnitCode: "pcs",
  },
  {
    name: "Label Merek Tempel",
    sku: "PK-LABEL-STICK",
    itemType: "packaging",
    defaultUnitCode: "pcs",
  },
  {
    name: "Plastik Luar Lusin",
    sku: "PK-SOCK-DOZEN",
    itemType: "packaging",
    defaultUnitCode: "pcs",
  },

  // Apparel/manufacturing examples
  {
    name: "Benang Jahit",
    sku: "RM-THREAD",
    itemType: "raw_material",
    defaultUnitCode: "kg",
  },
  {
    name: "Kain Katun",
    sku: "RM-COTTON",
    itemType: "raw_material",
    defaultUnitCode: "m",
  },
  {
    name: "Kancing Baju",
    sku: "RM-BUTTON",
    itemType: "raw_material",
    defaultUnitCode: "pcs",
  },
  {
    name: "Resleting",
    sku: "RM-ZIPPER",
    itemType: "raw_material",
    defaultUnitCode: "pcs",
  },

  // Service examples
  {
    name: "Jasa Jahit Vendor",
    sku: "SV-SEW-VENDOR",
    itemType: "service",
    defaultUnitCode: "pcs",
  },
];

const defaultCostItemPrices: DefaultCostItemPrice[] = [
  {
    itemName: "Kaos Kaki Polos",
    unitCode: "pair",
    pricePerUnit: "3500",
    sourceNote: "seed-default-cost-items-v1",
  },
  {
    itemName: "Plastik Kecil Kaos Kaki",
    unitCode: "pcs",
    pricePerUnit: "120",
    sourceNote: "seed-default-cost-items-v1",
  },
  {
    itemName: "Label Merek Tempel",
    unitCode: "pcs",
    pricePerUnit: "80",
    sourceNote: "seed-default-cost-items-v1",
  },
  {
    itemName: "Plastik Luar Lusin",
    unitCode: "pcs",
    pricePerUnit: "450",
    sourceNote: "seed-default-cost-items-v1",
  },
  {
    itemName: "Benang Jahit",
    unitCode: "kg",
    pricePerUnit: "65000",
    sourceNote: "seed-default-cost-items-v1",
  },
  {
    itemName: "Kain Katun",
    unitCode: "m",
    pricePerUnit: "28000",
    sourceNote: "seed-default-cost-items-v1",
  },
  {
    itemName: "Kancing Baju",
    unitCode: "pcs",
    pricePerUnit: "250",
    sourceNote: "seed-default-cost-items-v1",
  },
  {
    itemName: "Resleting",
    unitCode: "pcs",
    pricePerUnit: "1800",
    sourceNote: "seed-default-cost-items-v1",
  },
  {
    itemName: "Jasa Jahit Vendor",
    unitCode: "pcs",
    pricePerUnit: "12000",
    sourceNote: "seed-default-cost-items-v1",
  },
];

const seedDefaultCostItems = async () => {
  const unitRows = await db.query.units.findMany({
    columns: { id: true, code: true },
  });
  const unitByCode = new Map(unitRows.map((unit) => [unit.code, unit.id]));

  for (const item of defaultCostItems) {
    const defaultUnitId = unitByCode.get(item.defaultUnitCode);
    if (!defaultUnitId) {
      throw new Error(
        `Unit with code '${item.defaultUnitCode}' not found. Run 'bun run seed:units' first.`
      );
    }

    await db
      .insert(costItems)
      .values({
        name: item.name,
        sku: item.sku,
        itemType: item.itemType,
        defaultUnitId,
      })
      .onConflictDoUpdate({
        target: [costItems.name],
        set: {
          sku: item.sku,
          itemType: item.itemType,
          defaultUnitId,
        },
      });
  }

  const itemRows = await db.query.costItems.findMany({
    columns: { id: true, name: true },
  });
  const itemByName = new Map(itemRows.map((item) => [item.name, item.id]));

  for (const itemPrice of defaultCostItemPrices) {
    const itemId = itemByName.get(itemPrice.itemName);
    const unitId = unitByCode.get(itemPrice.unitCode);

    if (!itemId || !unitId) {
      throw new Error(
        `Missing item/unit for price seed '${itemPrice.itemName}'`
      );
    }

    const existingSeedPrice = await db.query.costItemPrices.findFirst({
      where: and(
        eq(costItemPrices.itemId, itemId),
        eq(costItemPrices.unitId, unitId),
        eq(costItemPrices.sourceNote, itemPrice.sourceNote)
      ),
    });

    if (!existingSeedPrice) {
      await db.insert(costItemPrices).values({
        itemId,
        unitId,
        pricePerUnit: itemPrice.pricePerUnit,
        sourceNote: itemPrice.sourceNote,
      });
    }
  }

  console.warn(
    `Seed completed: ${defaultCostItems.length} cost items, ${defaultCostItemPrices.length} default prices`
  );
};

seedDefaultCostItems()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed default cost items");
    console.error(error);
    process.exit(1);
  });
