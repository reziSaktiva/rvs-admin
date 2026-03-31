import { createClient } from "@supabase/supabase-js";

/**
 * Admin client menggunakan Service Role Key.
 * Hanya digunakan di server-side (server actions / route handlers).
 * JANGAN gunakan di client component.
 */
export function createAdminClient() {

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}
