import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Selalu gunakan getUser() bukan getSession() untuk keamanan server-side
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const publicPaths = ["/login", "/reset-password"];
    const isPublicPage = publicPaths.some((path) =>
        request.nextUrl.pathname.startsWith(path)
    );

    // Jika belum login dan bukan di halaman publik → redirect ke /login
    if (!user && !isPublicPage) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // Jika sudah login dan membuka halaman publik → redirect ke /
    if (user && isPublicPage) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Cocokkan semua path kecuali:
         * - _next/static (file statis)
         * - _next/image (optimisasi gambar)
         * - favicon.ico
         * - file gambar publik
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
