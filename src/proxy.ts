import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ACTIVE_COMPANY_COOKIE_NAME } from "@/lib/company/active-company";

const PUBLIC_PATH_PREFIXES = ["/login", "/register", "/reset-password"];
const COMPANY_SELECTION_PATH_PREFIXES = ["/select-company", "/companies/new"];

const isPathMatchingPrefix = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname.startsWith(prefix));

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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
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

  const pathname = request.nextUrl.pathname;
  const isPublicPage = isPathMatchingPrefix(pathname, PUBLIC_PATH_PREFIXES);
  const isCompanySelectionPage = isPathMatchingPrefix(pathname, COMPANY_SELECTION_PATH_PREFIXES);

  // Jika belum login dan bukan di halaman publik → redirect ke /login
  if (!user && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Jika sudah login dan membuka halaman publik auth → redirect ke pilih company.
  if (user && isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/select-company";
    return NextResponse.redirect(url);
  }

  // Halaman pemilihan company tetap bisa diakses meski belum ada active_company_id.
  if (user && isCompanySelectionPage) {
    return supabaseResponse;
  }

  if (user) {
    const activeCompanyId = request.cookies.get(ACTIVE_COMPANY_COOKIE_NAME)?.value;
    if (!activeCompanyId) {
      const url = request.nextUrl.clone();
      url.pathname = "/select-company";
      return NextResponse.redirect(url);
    }

    const { data: membership, error: membershipError } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("profile_id", user.id)
      .eq("company_id", activeCompanyId)
      .maybeSingle();

    if (membershipError || !membership) {
      const response = NextResponse.redirect(new URL("/select-company", request.url));
      response.cookies.set(ACTIVE_COMPANY_COOKIE_NAME, "", {
        path: "/",
        maxAge: 0,
      });
      return response;
    }
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
