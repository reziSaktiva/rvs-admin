import { and, asc, eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { companyMembers, companies } from "@/lib/db/drizzle/schema";
import { createClient } from "@/lib/supabase/server";

export const ACTIVE_COMPANY_COOKIE_NAME = "active_company_id";

type CompanyMembershipSummary = {
  companyId: string;
  companyName: string;
  companySlug: string;
  roleId: string;
  roleTitle: string;
  roleDisplayName: string;
};

const ACTIVE_COMPANY_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const getActiveCompanyIdFromCookies = async () => {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_COMPANY_COOKIE_NAME)?.value ?? null;
};

export const setActiveCompanyIdCookie = async (companyId: string) => {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_COMPANY_COOKIE_NAME, companyId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ACTIVE_COMPANY_COOKIE_MAX_AGE_SECONDS,
  });
};

export const clearActiveCompanyIdCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_COMPANY_COOKIE_NAME, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
};

export const getCompanyMembershipsByProfileId = async (
  profileId: string
): Promise<CompanyMembershipSummary[]> => {
  const rows = await db.query.companyMembers.findMany({
    where: eq(companyMembers.profileId, profileId),
    with: {
      company: {
        columns: {
          id: true,
          name: true,
          slug: true,
        },
      },
      role: {
        columns: {
          id: true,
          title: true,
          displayName: true,
        },
      },
    },
    orderBy: [asc(companyMembers.joinedAt)],
  });

  return rows.map((row) => ({
    companyId: row.companyId,
    companyName: row.company.name,
    companySlug: row.company.slug,
    roleId: row.roleId,
    roleTitle: row.role.title,
    roleDisplayName: row.role.displayName,
  }));
};

export const getMembershipForProfileAndCompany = async (
  profileId: string,
  companyId: string
) => {
  return db.query.companyMembers.findFirst({
    where: and(eq(companyMembers.profileId, profileId), eq(companyMembers.companyId, companyId)),
    with: {
      company: {
        columns: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
        },
      },
      role: {
        columns: {
          id: true,
          title: true,
          displayName: true,
        },
      },
    },
  });
};

export const getCurrentUserActiveCompanyContext = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const activeCompanyId = await getActiveCompanyIdFromCookies();
  if (!activeCompanyId) return null;

  const membership = await getMembershipForProfileAndCompany(user.id, activeCompanyId);
  if (!membership) return null;

  return {
    userId: user.id,
    companyId: membership.companyId,
    companyName: membership.company.name,
    companySlug: membership.company.slug,
    roleId: membership.roleId,
    roleTitle: membership.role.title,
    roleDisplayName: membership.role.displayName,
  };
};

export const getRoleByTitle = async (title: string) => {
  const normalized = title.trim().toLowerCase();
  if (!normalized) return null;

  const allRoles = await db.query.roles.findMany({
    columns: {
      id: true,
      title: true,
      displayName: true,
    },
  });

  return allRoles.find((role) => role.title.trim().toLowerCase() === normalized) ?? null;
};

const ensureOwnerRole = async () => {
  const existingOwnerRole = await getRoleByTitle("owner");
  if (existingOwnerRole) return existingOwnerRole;

  const columnRows = await db.execute<{ column_name: string }>(
    sql`select column_name from information_schema.columns where table_schema = 'public' and table_name = 'roles'`
  );
  const roleColumns = new Set(
    Array.from(columnRows).map((row) => row.column_name)
  );
  const roleTitleColumn = roleColumns.has("title")
    ? "title"
    : roleColumns.has("name")
      ? "name"
      : null;

  if (!roleTitleColumn) {
    throw new Error("Tabel roles tidak memiliki kolom title/name untuk menyimpan role owner.");
  }

  const insertColumns = [roleTitleColumn];
  const insertValues = ["owner"];
  if (roleColumns.has("display_name")) {
    insertColumns.push("display_name");
    insertValues.push("Owner");
  }

  const toggleTrueColumns = [
    "can_manage_users",
    "can_manage_products",
    "can_edit_products",
    "can_use_pos",
    "can_access_finance",
    "can_access_all",
  ].filter((column) => roleColumns.has(column));
  for (const column of toggleTrueColumns) {
    insertColumns.push(column);
    insertValues.push("true");
  }

  try {
    const columnSql = insertColumns.map((column) => sql.raw(`"${column}"`));
    const valueSql = insertValues.map((value) =>
      value === "true" ? sql`true` : sql`${value}`
    );

    await db.execute(
      sql`insert into "roles" (${sql.join(columnSql, sql`, `)}) values (${sql.join(valueSql, sql`, `)}) on conflict (${sql.raw(`"${roleTitleColumn}"`)}) do nothing`
    );
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    // Jika role owner sudah dibuat oleh proses lain secara paralel, lanjutkan fetch ulang.
    if (code !== "23505") {
      throw error;
    }
  }

  const ownerRole = await getRoleByTitle("owner");
  if (!ownerRole) {
    throw new Error("Gagal menyiapkan role owner.");
  }

  return ownerRole;
};

const slugify = (input: string) =>
  input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

export const generateUniqueCompanySlug = async (companyName: string) => {
  const baseSlug = slugify(companyName) || "company";
  const existing = await db.query.companies.findMany({
    where: (table, { like }) => like(table.slug, `${baseSlug}%`),
    columns: {
      slug: true,
    },
  });

  const existingSlugs = new Set(existing.map((row) => row.slug));
  if (!existingSlugs.has(baseSlug)) return baseSlug;

  let index = 2;
  while (existingSlugs.has(`${baseSlug}-${index}`)) {
    index += 1;
  }

  return `${baseSlug}-${index}`;
};

export const createCompanyAndAssignOwner = async (params: {
  profileId: string;
  companyName: string;
}) => {
  const ownerRole = await ensureOwnerRole();

  const slug = await generateUniqueCompanySlug(params.companyName);
  const now = new Date().toISOString();

  return db.transaction(async (tx) => {
    const [createdCompany] = await tx
      .insert(companies)
      .values({
        name: params.companyName,
        slug,
        isActive: true,
        updatedAt: now,
      })
      .returning({
        id: companies.id,
        name: companies.name,
        slug: companies.slug,
      });

    if (!createdCompany?.id) {
      throw new Error("Gagal membuat company baru.");
    }

    await tx.insert(companyMembers).values({
      companyId: createdCompany.id,
      profileId: params.profileId,
      roleId: ownerRole.id,
      joinedAt: now,
    });

    return createdCompany;
  });
};
