import {
  pgTable,
  unique,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  foreignKey,
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

// ─── Products ─────────────────────────────────────────────────────────────────

export const product = pgTable(
  "products",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    slug: text(),
    category: text().notNull(),
    tags: text().array(),
    quality: text(),
    buyPrice: integer("buy_price").default(0),
    price: integer().notNull(),
    packingCost: integer("packing_cost").default(0),
    stok: integer().default(0),
    unit: text().default("pasang"),
    image: text(),
    status: boolean().default(true),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [unique("product_slug_key").on(table.slug)]
);
