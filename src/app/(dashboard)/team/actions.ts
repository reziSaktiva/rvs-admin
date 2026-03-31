"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const supabase = createAdminClient();

    const roleIdTrimmed = payload.roleId?.trim();
    const phoneTrimmed = payload.phone?.trim();

    // user_metadata dipakai trigger Supabase (handle_new_user) — jangan kirim "" untuk
    // field uuid agar trigger tidak menjalankan ''::uuid (error di DB → "Database error creating new user").
    const userMetadata: Record<string, string> = {
        username: payload.username.trim(),
        full_name: payload.fullName.trim(),
        gender: payload.gender,
    };
    if (phoneTrimmed) userMetadata.phone = phoneTrimmed;
    if (roleIdTrimmed) userMetadata.role_id = roleIdTrimmed;

    // 1. Buat user di Supabase Auth
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

    const userId = authData.user.id;

    revalidatePath("/team");

    return {
        success: true,
        message: "Anggota dengan username " + payload.username + " dan id " + userId + " berhasil ditambahkan.",
    };
}
