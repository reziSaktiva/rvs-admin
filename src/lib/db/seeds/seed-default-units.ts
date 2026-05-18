import "dotenv/config";
import { and, eq, inArray, isNull } from "drizzle-orm";
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
  multiplier: number;
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
  { fromCode: "kg", toCode: "g", multiplier: 1000 },
  { fromCode: "kg", toCode: "ons", multiplier: 10 },
  { fromCode: "ons", toCode: "g", multiplier: 100 },
  { fromCode: "l", toCode: "ml", multiplier: 1000 },
  { fromCode: "m", toCode: "cm", multiplier: 100 },
  { fromCode: "dozen", toCode: "pcs", multiplier: 12 },
  { fromCode: "pair", toCode: "pcs", multiplier: 2 },
];

const seedDefaultUnits = async () => {
  const globalCodes = defaultUnits.map((unit) => unit.code);
  const existingGlobalUnits = await db.query.units.findMany({
    where: and(isNull(units.companyId), inArray(units.code, globalCodes)),
    columns: { id: true, code: true, name: true, dimension: true },
  });

  const existingGlobalByCode = new Map(existingGlobalUnits.map((unit) => [unit.code, unit]));
  const missingGlobalUnits = defaultUnits
    .filter((unit) => !existingGlobalByCode.has(unit.code))
    .map((unit) => ({
      companyId: null,
      code: unit.code,
      name: unit.name,
      dimension: unit.dimension,
    }));

  if (missingGlobalUnits.length > 0) {
    await db.insert(units).values(missingGlobalUnits);
  }

  for (const unit of defaultUnits) {
    const existing = existingGlobalByCode.get(unit.code);
    if (!existing) continue;
    if (existing.name === unit.name && existing.dimension === unit.dimension) continue;

    await db
      .update(units)
      .set({ name: unit.name, dimension: unit.dimension })
      .where(and(eq(units.id, existing.id), isNull(units.companyId)));
  }

  const seededUnits = await db.query.units.findMany({
    where: and(isNull(units.companyId), inArray(units.code, globalCodes)),
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
      companyId: null,
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
