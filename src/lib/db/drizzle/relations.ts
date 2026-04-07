import { relations } from "drizzle-orm";
import {
  roles,
  profiles,
  product,
  productVariant,
  categories,
  keywords,
  productKeywords,
  units,
  unitConversions,
  costItems,
  costItemPrices,
  recipes,
  recipeMaterials,
  recipeCosts,
  costItemInventoryBalances,
  costItemInventoryMovements,
} from "./schema";

// ─── Roles ────────────────────────────────────────────────────────────────────

export const rolesRelations = relations(roles, ({ many }) => ({
  profiles: many(profiles),
}));

// ─── Profiles ─────────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ one }) => ({
  role: one(roles, {
    fields: [profiles.roleId],
    references: [roles.id],
  }),
}));

// ─── Categories ───────────────────────────────────────────────────────────────

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(product),
}));

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const keywordsRelations = relations(keywords, ({ many }) => ({
  productKeywords: many(productKeywords),
}));

// ─── Products ─────────────────────────────────────────────────────────────────

export const productRelations = relations(product, ({ one, many }) => ({
  category: one(categories, {
    fields: [product.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariant),
  productKeywords: many(productKeywords),
}));

// ─── Product Variants ─────────────────────────────────────────────────────────

export const productVariantRelations = relations(productVariant, ({ one, many }) => ({
  product: one(product, {
    fields: [productVariant.productId],
    references: [product.id],
  }),
  recipes: many(recipes),
}));

// ─── Product Tags ─────────────────────────────────────────────────────────────

export const productKeywordsRelations = relations(productKeywords, ({ one }) => ({
  product: one(product, {
    fields: [productKeywords.productId],
    references: [product.id],
  }),
  tag: one(keywords, {
    fields: [productKeywords.tagId],
    references: [keywords.id],
  }),
}));

// ─── Units ────────────────────────────────────────────────────────────────────

export const unitsRelations = relations(units, ({ many }) => ({
  costItems: many(costItems),
  costItemPrices: many(costItemPrices),
  inventoryBalances: many(costItemInventoryBalances),
  inventoryMovements: many(costItemInventoryMovements),
  outputRecipes: many(recipes),
  recipeMaterials: many(recipeMaterials),
  conversionFrom: many(unitConversions, {
    relationName: "unit_conversions_from",
  }),
  conversionTo: many(unitConversions, {
    relationName: "unit_conversions_to",
  }),
}));

export const unitConversionsRelations = relations(unitConversions, ({ one }) => ({
  fromUnit: one(units, {
    relationName: "unit_conversions_from",
    fields: [unitConversions.fromUnitId],
    references: [units.id],
  }),
  toUnit: one(units, {
    relationName: "unit_conversions_to",
    fields: [unitConversions.toUnitId],
    references: [units.id],
  }),
}));

// ─── Cost Items ───────────────────────────────────────────────────────────────

export const costItemsRelations = relations(costItems, ({ one, many }) => ({
  defaultUnit: one(units, {
    fields: [costItems.defaultUnitId],
    references: [units.id],
  }),
  prices: many(costItemPrices),
  recipeMaterials: many(recipeMaterials),
  inventoryBalances: many(costItemInventoryBalances),
  inventoryMovements: many(costItemInventoryMovements),
}));

export const costItemPricesRelations = relations(costItemPrices, ({ one }) => ({
  item: one(costItems, {
    fields: [costItemPrices.itemId],
    references: [costItems.id],
  }),
  unit: one(units, {
    fields: [costItemPrices.unitId],
    references: [units.id],
  }),
}));

// ─── Recipes (BOM) ────────────────────────────────────────────────────────────

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  productVariant: one(productVariant, {
    fields: [recipes.productVariantId],
    references: [productVariant.id],
  }),
  outputUnit: one(units, {
    fields: [recipes.outputUnitId],
    references: [units.id],
  }),
  materials: many(recipeMaterials),
  costs: many(recipeCosts),
}));

export const recipeMaterialsRelations = relations(recipeMaterials, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeMaterials.recipeId],
    references: [recipes.id],
  }),
  item: one(costItems, {
    fields: [recipeMaterials.itemId],
    references: [costItems.id],
  }),
  unit: one(units, {
    fields: [recipeMaterials.unitId],
    references: [units.id],
  }),
}));

export const recipeCostsRelations = relations(recipeCosts, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeCosts.recipeId],
    references: [recipes.id],
  }),
}));

// ─── Inventory Valuation ──────────────────────────────────────────────────────

export const costItemInventoryBalancesRelations = relations(
  costItemInventoryBalances,
  ({ one }) => ({
    item: one(costItems, {
      fields: [costItemInventoryBalances.itemId],
      references: [costItems.id],
    }),
    unit: one(units, {
      fields: [costItemInventoryBalances.unitId],
      references: [units.id],
    }),
  })
);

export const costItemInventoryMovementsRelations = relations(
  costItemInventoryMovements,
  ({ one }) => ({
    item: one(costItems, {
      fields: [costItemInventoryMovements.itemId],
      references: [costItems.id],
    }),
    unit: one(units, {
      fields: [costItemInventoryMovements.unitId],
      references: [units.id],
    }),
  })
);
