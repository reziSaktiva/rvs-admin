-- Migration: 0002_add_companies
-- Menambahkan tabel companies dan company_members untuk mendukung arsitektur multi-tenant.
-- Setiap company adalah workspace terisolasi. company_members menghubungkan user ke company
-- dengan role tertentu. Role "owner" adalah role utama yang ditetapkan saat company dibuat.

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT companies_name_key UNIQUE (name),
  CONSTRAINT companies_slug_key UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS public.company_members (
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT company_members_pkey PRIMARY KEY (company_id, profile_id)
);
