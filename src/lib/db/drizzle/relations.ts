import { relations } from "drizzle-orm";
import {
  roles,
  profiles,
  product,
  productVariant,
  categories,
  keywords,
  productKeywords,
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

export const productVariantRelations = relations(productVariant, ({ one }) => ({
  product: one(product, {
    fields: [productVariant.productId],
    references: [product.id],
  }),
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
