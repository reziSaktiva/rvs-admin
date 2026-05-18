import { relations } from "drizzle-orm";
import {
  roles,
  profiles,
  companies,
  companyMembers,
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
  companyMembers: many(companyMembers, { relationName: "member_role" }),
}));

// ─── Companies ────────────────────────────────────────────────────────────────

export const companiesRelations = relations(companies, ({ many }) => ({
  members: many(companyMembers, { relationName: "member_company" }),
  categories: many(categories),
  keywords: many(keywords),
  products: many(product),
  productVariants: many(productVariant),
  productKeywords: many(productKeywords),
  units: many(units),
  unitConversions: many(unitConversions),
  costItems: many(costItems),
  costItemPrices: many(costItemPrices),
  recipes: many(recipes),
  recipeMaterials: many(recipeMaterials),
  recipeCosts: many(recipeCosts),
  inventoryBalances: many(costItemInventoryBalances),
  inventoryMovements: many(costItemInventoryMovements),
}));

// ─── Company Members ──────────────────────────────────────────────────────────

export const companyMembersRelations = relations(companyMembers, ({ one }) => ({
  company: one(companies, {
    relationName: "member_company",
    fields: [companyMembers.companyId],
    references: [companies.id],
  }),
  profile: one(profiles, {
    relationName: "member_profile",
    fields: [companyMembers.profileId],
    references: [profiles.id],
  }),
  role: one(roles, {
    relationName: "member_role",
    fields: [companyMembers.roleId],
    references: [roles.id],
  }),
}));

// ─── Profiles ─────────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ many }) => ({
  companyMemberships: many(companyMembers, { relationName: "member_profile" }),
}));

// ─── Categories ───────────────────────────────────────────────────────────────

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  company: one(companies, {
    fields: [categories.companyId],
    references: [companies.id],
  }),
  products: many(product),
}));

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const keywordsRelations = relations(keywords, ({ one, many }) => ({
  company: one(companies, {
    fields: [keywords.companyId],
    references: [companies.id],
  }),
  productKeywords: many(productKeywords),
}));

// ─── Products ─────────────────────────────────────────────────────────────────

export const productRelations = relations(product, ({ one, many }) => ({
  company: one(companies, {
    fields: [product.companyId],
    references: [companies.id],
  }),
  category: one(categories, {
    fields: [product.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariant),
  productKeywords: many(productKeywords),
}));

// ─── Product Variants ─────────────────────────────────────────────────────────

export const productVariantRelations = relations(productVariant, ({ one, many }) => ({
  company: one(companies, {
    fields: [productVariant.companyId],
    references: [companies.id],
  }),
  product: one(product, {
    fields: [productVariant.productId],
    references: [product.id],
  }),
  recipes: many(recipes),
}));

// ─── Product Tags ─────────────────────────────────────────────────────────────

export const productKeywordsRelations = relations(productKeywords, ({ one }) => ({
  company: one(companies, {
    fields: [productKeywords.companyId],
    references: [companies.id],
  }),
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

export const unitsRelations = relations(units, ({ one, many }) => ({
  company: one(companies, {
    fields: [units.companyId],
    references: [companies.id],
  }),
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
  company: one(companies, {
    fields: [unitConversions.companyId],
    references: [companies.id],
  }),
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
  company: one(companies, {
    fields: [costItems.companyId],
    references: [companies.id],
  }),
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
  company: one(companies, {
    fields: [costItemPrices.companyId],
    references: [companies.id],
  }),
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
  company: one(companies, {
    fields: [recipes.companyId],
    references: [companies.id],
  }),
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
  company: one(companies, {
    fields: [recipeMaterials.companyId],
    references: [companies.id],
  }),
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
  company: one(companies, {
    fields: [recipeCosts.companyId],
    references: [companies.id],
  }),
  recipe: one(recipes, {
    fields: [recipeCosts.recipeId],
    references: [recipes.id],
  }),
}));

// ─── Inventory Valuation ──────────────────────────────────────────────────────

export const costItemInventoryBalancesRelations = relations(
  costItemInventoryBalances,
  ({ one }) => ({
    company: one(companies, {
      fields: [costItemInventoryBalances.companyId],
      references: [companies.id],
    }),
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
    company: one(companies, {
      fields: [costItemInventoryMovements.companyId],
      references: [companies.id],
    }),
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
