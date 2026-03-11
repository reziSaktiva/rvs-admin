CREATE TYPE "public"."gender_type" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"category" text NOT NULL,
	"tags" text[],
	"quality" text,
	"buy_price" integer DEFAULT 0,
	"price" integer NOT NULL,
	"packing_cost" integer DEFAULT 0,
	"stok" integer DEFAULT 0,
	"unit" text DEFAULT 'pasang',
	"image" text,
	"status" boolean DEFAULT true,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "product_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"gender" "gender_type" DEFAULT 'other' NOT NULL,
	"photo_url" text,
	"role_id" uuid,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"can_manage_users" boolean DEFAULT false,
	"can_manage_products" boolean DEFAULT false,
	"can_edit_products" boolean DEFAULT false,
	"can_use_pos" boolean DEFAULT false,
	"can_access_finance" boolean DEFAULT false,
	"can_access_all" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "roles_name_key" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;