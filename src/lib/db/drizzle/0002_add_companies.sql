-- Custom SQL migration file, put your code below! --

CREATE TABLE IF NOT EXISTS "companies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "logo_url" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "companies_name_key" UNIQUE ("name"),
  CONSTRAINT "companies_slug_key" UNIQUE ("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company_members" (
  "company_id" uuid NOT NULL,
  "profile_id" uuid NOT NULL,
  "role_id" uuid NOT NULL,
  "joined_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "company_members_pkey" PRIMARY KEY ("company_id","profile_id")
);
--> statement-breakpoint
ALTER TABLE "company_members"
  ADD CONSTRAINT "company_members_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "company_members"
  ADD CONSTRAINT "company_members_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "company_members"
  ADD CONSTRAINT "company_members_role_id_fkey"
  FOREIGN KEY ("role_id") REFERENCES "roles"("id");
