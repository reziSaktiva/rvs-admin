-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	"tags" text[] DEFAULT '{""}',
	"quality" text DEFAULT 'Standar',
	"description" text,
	"buy_price" integer DEFAULT 0 NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"packing_cost" integer DEFAULT 0 NOT NULL,
	"stok" integer DEFAULT 0 NOT NULL,
	"unit" text DEFAULT 'pasang',
	"image" text DEFAULT '/placeholder.jpg',
	"status" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "products_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "idx_products_category" ON "products" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX "idx_products_name" ON "products" USING gin (to_tsvector('indonesian'::regconfig, name) tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_products_status" ON "products" USING btree ("status" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_products_tags" ON "products" USING gin ("tags" array_ops);
*/