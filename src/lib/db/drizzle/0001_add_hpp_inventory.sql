DO $$ BEGIN
 CREATE TYPE "public"."item_type" AS ENUM('raw_material', 'packaging', 'finished_good', 'service');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."recipe_status_type" AS ENUM('draft', 'active', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."cost_component_type" AS ENUM('material', 'labor', 'overhead', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."cost_basis_type" AS ENUM('per_batch', 'per_unit');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."stock_movement_type" AS ENUM(
  'opening',
  'purchase',
  'production_in',
  'production_out',
  'sale_out',
  'adjustment_in',
  'adjustment_out',
  'return_in',
  'return_out',
  'transfer_in',
  'transfer_out'
 );
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "units" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "code" text NOT NULL,
 "name" text NOT NULL,
 "dimension" text NOT NULL,
 "created_at" timestamp with time zone DEFAULT now(),
 CONSTRAINT "units_code_key" UNIQUE("code"),
 CONSTRAINT "units_name_key" UNIQUE("name")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "unit_conversions" (
 "from_unit_id" uuid NOT NULL,
 "to_unit_id" uuid NOT NULL,
 "multiplier" numeric(18, 8) NOT NULL,
 "created_at" timestamp with time zone DEFAULT now(),
 CONSTRAINT "unit_conversions_pkey" PRIMARY KEY("from_unit_id","to_unit_id")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "cost_items" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "name" text NOT NULL,
 "sku" text,
 "item_type" "item_type" DEFAULT 'raw_material' NOT NULL,
 "default_unit_id" uuid NOT NULL,
 "is_active" boolean DEFAULT true,
 "created_at" timestamp with time zone DEFAULT now(),
 "updated_at" timestamp with time zone DEFAULT now(),
 CONSTRAINT "cost_items_name_key" UNIQUE("name"),
 CONSTRAINT "cost_items_sku_key" UNIQUE("sku")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "cost_item_prices" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "item_id" uuid NOT NULL,
 "unit_id" uuid NOT NULL,
 "price_per_unit" numeric(14, 4) NOT NULL,
 "effective_from" timestamp with time zone DEFAULT now(),
 "source_note" text,
 "created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "recipes" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "product_variant_id" uuid NOT NULL,
 "name" text NOT NULL,
 "output_qty" numeric(14, 4) DEFAULT '1' NOT NULL,
 "output_unit_id" uuid NOT NULL,
 "loss_percent" numeric(5, 2) DEFAULT '0',
 "status" "recipe_status_type" DEFAULT 'draft' NOT NULL,
 "notes" text,
 "created_at" timestamp with time zone DEFAULT now(),
 "updated_at" timestamp with time zone DEFAULT now(),
 CONSTRAINT "recipes_product_variant_id_name_key" UNIQUE("product_variant_id","name")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "recipe_materials" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "recipe_id" uuid NOT NULL,
 "item_id" uuid NOT NULL,
 "qty" numeric(14, 4) NOT NULL,
 "unit_id" uuid NOT NULL,
 "waste_percent" numeric(5, 2) DEFAULT '0',
 "is_optional" boolean DEFAULT false,
 "sort_order" integer DEFAULT 0,
 "created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "recipe_costs" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "recipe_id" uuid NOT NULL,
 "name" text NOT NULL,
 "component_type" "cost_component_type" DEFAULT 'overhead' NOT NULL,
 "basis" "cost_basis_type" DEFAULT 'per_batch' NOT NULL,
 "amount" numeric(14, 4) NOT NULL,
 "created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "cost_item_inventory_balances" (
 "item_id" uuid PRIMARY KEY NOT NULL,
 "qty_on_hand" numeric(18, 4) DEFAULT '0' NOT NULL,
 "unit_id" uuid NOT NULL,
 "avg_cost_per_unit" numeric(14, 4) DEFAULT '0' NOT NULL,
 "asset_value" numeric(16, 4) DEFAULT '0' NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "cost_item_inventory_movements" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "item_id" uuid NOT NULL,
 "movement_type" "stock_movement_type" NOT NULL,
 "qty_delta" numeric(18, 4) NOT NULL,
 "unit_id" uuid NOT NULL,
 "unit_cost" numeric(14, 4),
 "value_delta" numeric(16, 4),
 "reference_type" text,
 "reference_id" text,
 "note" text,
 "occurred_at" timestamp with time zone DEFAULT now(),
 "created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "unit_conversions"
  ADD CONSTRAINT "unit_conversions_from_unit_id_fkey"
  FOREIGN KEY ("from_unit_id") REFERENCES "public"."units"("id")
  ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unit_conversions"
  ADD CONSTRAINT "unit_conversions_to_unit_id_fkey"
  FOREIGN KEY ("to_unit_id") REFERENCES "public"."units"("id")
  ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cost_items"
  ADD CONSTRAINT "cost_items_default_unit_id_fkey"
  FOREIGN KEY ("default_unit_id") REFERENCES "public"."units"("id")
  ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cost_item_prices"
  ADD CONSTRAINT "cost_item_prices_item_id_fkey"
  FOREIGN KEY ("item_id") REFERENCES "public"."cost_items"("id")
  ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cost_item_prices"
  ADD CONSTRAINT "cost_item_prices_unit_id_fkey"
  FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id")
  ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recipes"
  ADD CONSTRAINT "recipes_product_variant_id_fkey"
  FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id")
  ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recipes"
  ADD CONSTRAINT "recipes_output_unit_id_fkey"
  FOREIGN KEY ("output_unit_id") REFERENCES "public"."units"("id")
  ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recipe_materials"
  ADD CONSTRAINT "recipe_materials_recipe_id_fkey"
  FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id")
  ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recipe_materials"
  ADD CONSTRAINT "recipe_materials_item_id_fkey"
  FOREIGN KEY ("item_id") REFERENCES "public"."cost_items"("id")
  ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recipe_materials"
  ADD CONSTRAINT "recipe_materials_unit_id_fkey"
  FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id")
  ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recipe_costs"
  ADD CONSTRAINT "recipe_costs_recipe_id_fkey"
  FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id")
  ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cost_item_inventory_balances"
  ADD CONSTRAINT "cost_item_inventory_balances_item_id_fkey"
  FOREIGN KEY ("item_id") REFERENCES "public"."cost_items"("id")
  ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cost_item_inventory_balances"
  ADD CONSTRAINT "cost_item_inventory_balances_unit_id_fkey"
  FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id")
  ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cost_item_inventory_movements"
  ADD CONSTRAINT "cost_item_inventory_movements_item_id_fkey"
  FOREIGN KEY ("item_id") REFERENCES "public"."cost_items"("id")
  ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cost_item_inventory_movements"
  ADD CONSTRAINT "cost_item_inventory_movements_unit_id_fkey"
  FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id")
  ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;