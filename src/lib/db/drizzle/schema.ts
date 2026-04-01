import {
  pgTable,
  unique,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  pgEnum,
  foreignKey,
  primaryKey,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const genderType = pgEnum("gender_type", ["male", "female", "other"]);

// ─── Roles ────────────────────────────────────────────────────────────────────

export const roles = pgTable(
  "roles",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: text("title").notNull(),
    displayName: text("display_name").notNull(),
    canManageUsers: boolean("can_manage_users").default(false),
    canManageProducts: boolean("can_manage_products").default(false),
    canEditProducts: boolean("can_edit_products").default(false),
    canUsePos: boolean("can_use_pos").default(false),
    canAccessFinance: boolean("can_access_finance").default(false),
    canAccessAll: boolean("can_access_all").default(false),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [unique("roles_name_key").on(table.title)]
);

// ─── Profiles ─────────────────────────────────────────────────────────────────
// FK ke auth.users(id) tidak didefinisikan di sini karena auth schema
// dikelola oleh Supabase — constraint tetap aktif di level database.

export const profiles = pgTable(
  "profiles",
  {
    id: uuid().primaryKey().notNull(),
    username: text("username").notNull(),
    fullName: text("full_name").notNull(),
    phone: text("phone"),
    gender: genderType().default("other").notNull(),
    photoUrl: text("photo_url"),
    roleId: uuid("role_id"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "profiles_role_id_fkey",
      columns: [table.roleId],
      foreignColumns: [roles.id],
    }),
  ]
);

// ─── Products Taxonomy ────────────────────────────────────────────────────────

export const categories = pgTable(
  "categories",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text("name").notNull(),
    slug: text("slug"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    unique("categories_name_key").on(table.name),
    unique("categories_slug_key").on(table.slug),
  ]
);

export const tags = pgTable(
  "tags",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [unique("tags_name_key").on(table.name)]
);

// ─── Products ─────────────────────────────────────────────────────────────────

export const product = pgTable(
  "products",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text("name").notNull(),
    sku: text("sku"),
    barcode: text("barcode"),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    costPrice: numeric("cost_price", { precision: 12, scale: 2 }),
    stock: integer("stock").default(0),
    description: text("description"),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").default(true),
    categoryId: uuid("category_id"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    unique("products_sku_key").on(table.sku),
    foreignKey({
      name: "products_category_id_fkey",
      columns: [table.categoryId],
      foreignColumns: [categories.id],
    }),
  ]
);

export const productTags = pgTable(
  "product_tags",
  {
    productId: uuid("product_id").notNull(),
    tagId: uuid("tag_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.tagId], name: "product_tags_pkey" }),
    foreignKey({
      name: "product_tags_product_id_fkey",
      columns: [table.productId],
      foreignColumns: [product.id],
    }),
    foreignKey({
      name: "product_tags_tag_id_fkey",
      columns: [table.tagId],
      foreignColumns: [tags.id],
    }),
  ]
);
