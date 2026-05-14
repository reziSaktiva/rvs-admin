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
};

type ActionResult = {
    success: boolean;
    message: string;
};

export async function addMember(payload: AddMemberPayload): Promise<ActionResult> {
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

    revalidatePath("/team");

    return {
        success: true,
        message: `Anggota @${payload.username.trim()} berhasil ditambahkan.`,
    };
}
