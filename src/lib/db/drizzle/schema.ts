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
export const itemType = pgEnum("item_type", [
  "raw_material",
  "packaging",
  "finished_good",
  "service",
]);
export const recipeStatusType = pgEnum("recipe_status_type", [
  "draft",
  "active",
  "archived",
]);
export const costComponentType = pgEnum("cost_component_type", [
  "material",
  "labor",
  "overhead",
  "other",
]);
export const costBasisType = pgEnum("cost_basis_type", ["per_batch", "per_unit"]);
export const stockMovementType = pgEnum("stock_movement_type", [
  "opening",
  "purchase",
  "production_in",
  "production_out",
  "sale_out",
  "adjustment_in",
  "adjustment_out",
  "return_in",
  "return_out",
  "transfer_in",
  "transfer_out",
]);

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

export const keywords = pgTable(
  "keywords",
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
    foreignKey({
      name: "products_category_id_fkey",
      columns: [table.categoryId],
      foreignColumns: [categories.id],
    }),
  ]
);

export const productVariant = pgTable(
  "product_variants",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    productId: uuid("product_id").notNull(),
    size: text("size"),
    sku: text("sku"),
    barcode: text("barcode"),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    stock: integer("stock").default(0),
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
    unique("product_variants_barcode_key").on(table.barcode),
    unique("product_variants_sku_key").on(table.sku),
    foreignKey({
      name: "product_variants_product_id_fkey",
      columns: [table.productId],
      foreignColumns: [product.id],
    }).onDelete("cascade"),
  ]
);

export const productKeywords = pgTable(
  "product_keywords",
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
      foreignColumns: [keywords.id],
    }),
  ]
);

// ─── Production & HPP ─────────────────────────────────────────────────────────

export const units = pgTable(
  "units",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    dimension: text("dimension").notNull(), // count, weight, length, volume, etc.
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    unique("units_code_key").on(table.code),
    unique("units_name_key").on(table.name),
  ]
);

export const unitConversions = pgTable(
  "unit_conversions",
  {
    fromUnitId: uuid("from_unit_id").notNull(),
    toUnitId: uuid("to_unit_id").notNull(),
    multiplier: numeric("multiplier", { precision: 18, scale: 8 }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.fromUnitId, table.toUnitId],
      name: "unit_conversions_pkey",
    }),
    foreignKey({
      name: "unit_conversions_from_unit_id_fkey",
      columns: [table.fromUnitId],
      foreignColumns: [units.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "unit_conversions_to_unit_id_fkey",
      columns: [table.toUnitId],
      foreignColumns: [units.id],
    }).onDelete("cascade"),
  ]
);

export const costItems = pgTable(
  "cost_items",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text("name").notNull(),
    sku: text("sku"),
    itemType: itemType("item_type").default("raw_material").notNull(),
    defaultUnitId: uuid("default_unit_id").notNull(),
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
    unique("cost_items_name_key").on(table.name),
    unique("cost_items_sku_key").on(table.sku),
    foreignKey({
      name: "cost_items_default_unit_id_fkey",
      columns: [table.defaultUnitId],
      foreignColumns: [units.id],
    }),
  ]
);

export const costItemPrices = pgTable(
  "cost_item_prices",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    itemId: uuid("item_id").notNull(),
    unitId: uuid("unit_id").notNull(),
    pricePerUnit: numeric("price_per_unit", { precision: 14, scale: 4 }).notNull(),
    effectiveFrom: timestamp("effective_from", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    sourceNote: text("source_note"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "cost_item_prices_item_id_fkey",
      columns: [table.itemId],
      foreignColumns: [costItems.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "cost_item_prices_unit_id_fkey",
      columns: [table.unitId],
      foreignColumns: [units.id],
    }),
  ]
);

export const recipes = pgTable(
  "recipes",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    productVariantId: uuid("product_variant_id").notNull(),
    name: text("name").notNull(),
    outputQty: numeric("output_qty", { precision: 14, scale: 4 }).notNull().default("1"),
    outputUnitId: uuid("output_unit_id").notNull(),
    lossPercent: numeric("loss_percent", { precision: 5, scale: 2 }).default("0"),
    status: recipeStatusType("status").default("draft").notNull(),
    notes: text("notes"),
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
    unique("recipes_product_variant_id_name_key").on(table.productVariantId, table.name),
    foreignKey({
      name: "recipes_product_variant_id_fkey",
      columns: [table.productVariantId],
      foreignColumns: [productVariant.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "recipes_output_unit_id_fkey",
      columns: [table.outputUnitId],
      foreignColumns: [units.id],
    }),
  ]
);

export const recipeMaterials = pgTable(
  "recipe_materials",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    recipeId: uuid("recipe_id").notNull(),
    itemId: uuid("item_id").notNull(),
    qty: numeric("qty", { precision: 14, scale: 4 }).notNull(),
    unitId: uuid("unit_id").notNull(),
    wastePercent: numeric("waste_percent", { precision: 5, scale: 2 }).default("0"),
    isOptional: boolean("is_optional").default(false),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "recipe_materials_recipe_id_fkey",
      columns: [table.recipeId],
      foreignColumns: [recipes.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "recipe_materials_item_id_fkey",
      columns: [table.itemId],
      foreignColumns: [costItems.id],
    }),
    foreignKey({
      name: "recipe_materials_unit_id_fkey",
      columns: [table.unitId],
      foreignColumns: [units.id],
    }),
  ]
);

export const recipeCosts = pgTable(
  "recipe_costs",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    recipeId: uuid("recipe_id").notNull(),
    name: text("name").notNull(),
    componentType: costComponentType("component_type").default("overhead").notNull(),
    basis: costBasisType("basis").default("per_batch").notNull(),
    amount: numeric("amount", { precision: 14, scale: 4 }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "recipe_costs_recipe_id_fkey",
      columns: [table.recipeId],
      foreignColumns: [recipes.id],
    }).onDelete("cascade"),
  ]
);

// ─── Inventory Valuation ──────────────────────────────────────────────────────

export const costItemInventoryBalances = pgTable(
  "cost_item_inventory_balances",
  {
    itemId: uuid("item_id").primaryKey().notNull(),
    qtyOnHand: numeric("qty_on_hand", { precision: 18, scale: 4 }).notNull().default("0"),
    unitId: uuid("unit_id").notNull(),
    avgCostPerUnit: numeric("avg_cost_per_unit", { precision: 14, scale: 4 })
      .notNull()
      .default("0"),
    assetValue: numeric("asset_value", { precision: 16, scale: 4 }).notNull().default("0"),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "cost_item_inventory_balances_item_id_fkey",
      columns: [table.itemId],
      foreignColumns: [costItems.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "cost_item_inventory_balances_unit_id_fkey",
      columns: [table.unitId],
      foreignColumns: [units.id],
    }),
  ]
);

export const costItemInventoryMovements = pgTable(
  "cost_item_inventory_movements",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    itemId: uuid("item_id").notNull(),
    movementType: stockMovementType("movement_type").notNull(),
    qtyDelta: numeric("qty_delta", { precision: 18, scale: 4 }).notNull(),
    unitId: uuid("unit_id").notNull(),
    unitCost: numeric("unit_cost", { precision: 14, scale: 4 }),
    valueDelta: numeric("value_delta", { precision: 16, scale: 4 }),
    referenceType: text("reference_type"),
    referenceId: text("reference_id"),
    note: text("note"),
    occurredAt: timestamp("occurred_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "cost_item_inventory_movements_item_id_fkey",
      columns: [table.itemId],
      foreignColumns: [costItems.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "cost_item_inventory_movements_unit_id_fkey",
      columns: [table.unitId],
      foreignColumns: [units.id],
    }),
  ]
);
