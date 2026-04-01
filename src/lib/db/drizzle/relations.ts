import { relations } from "drizzle-orm";
import {
  roles,
  profiles,
  product,
  categories,
  tags,
  productTags,
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

export const tagsRelations = relations(tags, ({ many }) => ({
  productTags: many(productTags),
}));

// ─── Products ─────────────────────────────────────────────────────────────────

export const productRelations = relations(product, ({ one, many }) => ({
  category: one(categories, {
    fields: [product.categoryId],
    references: [categories.id],
  }),
  productTags: many(productTags),
}));

// ─── Product Tags ─────────────────────────────────────────────────────────────

export const productTagsRelations = relations(productTags, ({ one }) => ({
  product: one(product, {
    fields: [productTags.productId],
    references: [product.id],
  }),
  tag: one(tags, {
    fields: [productTags.tagId],
    references: [tags.id],
  }),
}));
