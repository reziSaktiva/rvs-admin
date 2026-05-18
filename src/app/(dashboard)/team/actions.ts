"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { companyMembers, roles } from "@/lib/db/drizzle/schema";
import { getCurrentUserActiveCompanyContext } from "@/lib/company/active-company";

type AddMemberPayload = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  gender: "male" | "female" | "other";
  roleId: string;
};

type ActionResult = {
  success: boolean;
  message: string;
};

export async function addMember(payload: AddMemberPayload): Promise<ActionResult> {
  const activeContext = await getCurrentUserActiveCompanyContext();
  if (!activeContext) {
    return {
      success: false,
      message: "Company aktif tidak ditemukan. Pilih company terlebih dahulu.",
    };
  }

  const selectedRole = await db.query.roles.findFirst({
    where: eq(roles.id, payload.roleId),
    columns: {
      id: true,
      displayName: true,
    },
  });
  if (!selectedRole) {
    return {
      success: false,
      message: "Role tidak valid.",
    };
  }

  const supabase = createAdminClient();
  const phoneTrimmed = payload.phone?.trim();

  // Role tidak disimpan di profiles.role_id lagi — role dikelola lewat company_members.
  // user_metadata hanya dipakai trigger handle_new_user untuk mengisi kolom profiles.
  const userMetadata: Record<string, string> = {
    username: payload.username.trim(),
    full_name: payload.fullName.trim(),
    gender: payload.gender,
  };
  if (phoneTrimmed) userMetadata.phone = phoneTrimmed;

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: payload.email.trim(),
    password: payload.password,
    email_confirm: true,
    user_metadata: userMetadata,
  });

  if (authError || !authData.user) {
    return {
      success: false,
      message: authError?.message ?? "Gagal membuat akun.",
    };
  }

  await db
    .insert(companyMembers)
    .values({
      companyId: activeContext.companyId,
      profileId: authData.user.id,
      roleId: selectedRole.id,
      joinedAt: new Date().toISOString(),
    })
    .onConflictDoNothing({
      target: [companyMembers.companyId, companyMembers.profileId],
    });

  revalidatePath("/team");

  return {
    success: true,
    message: `Anggota @${payload.username.trim()} berhasil ditambahkan ke company aktif.`,
  };
}
