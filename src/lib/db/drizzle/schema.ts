import { pgTable, index, unique, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const product = pgTable("product", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	category: text().notNull(),
	tags: text().array().default([""]),
	quality: text().default('Standar'),
	description: text(),
	buyPrice: integer("buy_price").default(0).notNull(),
	price: integer().default(0).notNull(),
	packingCost: integer("packing_cost").default(0).notNull(),
	stok: integer().default(0).notNull(),
	unit: text().default('pasang'),
	image: text().default('/placeholder.jpg'),
	status: boolean().default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	imageUrl: text("image_url").default('https://yniotgrgffdbzyvolylm.supabase.co/storage/v1/object/public/media/default.png').notNull(),
}, (table) => [
	index("idx_products_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_products_name").using("gin", sql`to_tsvector('indonesian'::regconfig, name)`),
	index("idx_products_status").using("btree", table.status.asc().nullsLast().op("bool_ops")),
	index("idx_products_tags").using("gin", table.tags.asc().nullsLast().op("array_ops")),
	unique("products_slug_key").on(table.slug),
]);
