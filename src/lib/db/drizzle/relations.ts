import { relations } from "drizzle-orm";
import { roles, profiles, product } from "./schema";

// ─── Roles ────────────────────────────────────────────────────────────────────

export const rolesRelations = relations(roles, ({ many }) => ({
  profiles: many(profiles),
}));

// ─── Profiles ─────────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  role: one(roles, {
    fields: [profiles.roleId],
    references: [roles.id],
  }),
  createdProducts: many(product, { relationName: "product_created_by" }),
  updatedProducts: many(product, { relationName: "product_updated_by" }),
}));
