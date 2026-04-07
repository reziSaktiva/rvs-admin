import "dotenv/config";
import { db } from "@/lib/db";
import { units, unitConversions } from "@/lib/db/drizzle/schema";

type DefaultUnit = {
  code: string;
  name: string;
  dimension: string;
};

type DefaultConversion = {
  fromCode: string;
  toCode: string;
  multiplier: string;
};

const defaultUnits: DefaultUnit[] = [
  { code: "pcs", name: "Pieces", dimension: "count" },
  { code: "pair", name: "Pair", dimension: "count" },
  { code: "dozen", name: "Dozen", dimension: "count" },
  { code: "pack", name: "Pack", dimension: "count" },
  { code: "g", name: "Gram", dimension: "weight" },
  { code: "kg", name: "Kilogram", dimension: "weight" },
  { code: "ons", name: "Ons", dimension: "weight" },
  { code: "m", name: "Meter", dimension: "length" },
  { code: "cm", name: "Centimeter", dimension: "length" },
  { code: "l", name: "Liter", dimension: "volume" },
  { code: "ml", name: "Milliliter", dimension: "volume" },
];

const defaultConversions: DefaultConversion[] = [
  { fromCode: "kg", toCode: "g", multiplier: "1000" },
  { fromCode: "kg", toCode: "ons", multiplier: "10" },
  { fromCode: "ons", toCode: "g", multiplier: "100" },
  { fromCode: "l", toCode: "ml", multiplier: "1000" },
  { fromCode: "m", toCode: "cm", multiplier: "100" },
  { fromCode: "dozen", toCode: "pcs", multiplier: "12" },
  { fromCode: "pair", toCode: "pcs", multiplier: "2" },
];

const seedDefaultUnits = async () => {
  await db
    .insert(units)
    .values(defaultUnits)
    .onConflictDoNothing({ target: units.code });

  const seededUnits = await db.query.units.findMany({
    columns: { id: true, code: true },
  });

  const unitByCode = new Map(seededUnits.map((unit) => [unit.code, unit.id]));

  const conversionValues = defaultConversions.map((conversion) => {
    const fromUnitId = unitByCode.get(conversion.fromCode);
    const toUnitId = unitByCode.get(conversion.toCode);

    if (!fromUnitId || !toUnitId) {
      throw new Error(
        `Missing unit id for conversion ${conversion.fromCode} -> ${conversion.toCode}`
      );
    }

    return {
      fromUnitId,
      toUnitId,
      multiplier: conversion.multiplier,
    };
  });

  for (const conversionValue of conversionValues) {
    await db
      .insert(unitConversions)
      .values(conversionValue)
      .onConflictDoUpdate({
        target: [unitConversions.fromUnitId, unitConversions.toUnitId],
        set: { multiplier: conversionValue.multiplier },
      });
  }

  console.warn(
    `Seed completed: ${defaultUnits.length} units, ${defaultConversions.length} conversions`
  );
};

seedDefaultUnits()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed default units and conversions");
    console.error(error);
    process.exit(1);
  });
