"use server";

import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { companyMembers } from "@/lib/db/drizzle/schema";
import {
  createCompanyAndAssignOwner,
  getCompanyMembershipsByProfileId,
  setActiveCompanyIdCookie,
} from "@/lib/company/active-company";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type AuthActionState = {
  error: string | null;
};

export async function login(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email atau password salah. Silakan coba lagi." };
  }

  redirect("/select-company");
}

export async function register(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const gender = String(formData.get("gender") ?? "other").trim();

  if (!email || !password || !fullName || !username) {
    return { error: "Lengkapi semua field yang wajib diisi." };
  }

  if (password.length < 8) {
    return { error: "Password minimal 8 karakter." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        username,
        gender: ["male", "female", "other"].includes(gender) ? gender : "other",
      },
    },
  });

  if (error) {
    return {
      error:
        error.message.includes("already registered")
          ? "Email sudah terdaftar. Silakan login."
          : error.message,
    };
  }

  // Saat konfirmasi email dinonaktifkan, user langsung login dan bisa lanjut memilih company.
  redirect("/select-company");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

type SelectCompanyState = {
  error: string | null;
};

const handleSelectActiveCompany = async (
  formData: FormData
): Promise<SelectCompanyState> => {
  const companyId = String(formData.get("companyId") ?? "").trim();
  if (!companyId) {
    return { error: "Company belum dipilih." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi login tidak ditemukan. Silakan login ulang." };
  }

  const membership = await db.query.companyMembers.findFirst({
    where: (table, { and, eq: eqOp }) =>
      and(eqOp(table.companyId, companyId), eqOp(table.profileId, user.id)),
    columns: {
      companyId: true,
    },
  });

  if (!membership) {
    return { error: "Kamu tidak memiliki akses ke company ini." };
  }

  await setActiveCompanyIdCookie(companyId);
  redirect("/");
}

export async function selectActiveCompany(
  _prevState: SelectCompanyState,
  formData: FormData
): Promise<SelectCompanyState> {
  return handleSelectActiveCompany(formData);
}

export async function selectActiveCompanyAction(formData: FormData) {
  const result = await handleSelectActiveCompany(formData);
  if (result.error) {
    const qp = new URLSearchParams({ error: result.error });
    redirect(`/select-company?${qp.toString()}`);
  }
}

type CreateCompanyState = {
  error: string | null;
};

export async function createCompanyAndContinue(
  _prevState: CreateCompanyState,
  formData: FormData
): Promise<CreateCompanyState> {
  const companyName = String(formData.get("companyName") ?? "").trim();
  if (!companyName) {
    return { error: "Nama company wajib diisi." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi login tidak ditemukan. Silakan login ulang." };
  }

  const existingMembership = await db.query.companyMembers.findFirst({
    where: eq(companyMembers.profileId, user.id),
    columns: {
      companyId: true,
    },
  });

  if (existingMembership) {
    const memberships = await getCompanyMembershipsByProfileId(user.id);
    const hasSameCompanyName = memberships.some(
      (item) => item.companyName.toLowerCase() === companyName.toLowerCase()
    );
    if (hasSameCompanyName) {
      return { error: "Nama company sudah ada di daftar company kamu." };
    }
  }

  const createdCompany = await createCompanyAndAssignOwner({
    profileId: user.id,
    companyName,
    email: user.email ?? null,
    userMetadata:
      typeof user.user_metadata === "object" && user.user_metadata !== null
        ? (user.user_metadata as Record<string, unknown>)
        : null,
  });

  await setActiveCompanyIdCookie(createdCompany.id);
  redirect("/");
}

export async function resetPassword(
  _prevState: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "";

  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/login`,
  });

  if (error) {
    console.error(error);
    return { error: "Gagal mengirim email reset. Silakan coba lagi.", success: false };
  }

  return { error: null, success: true };
}
