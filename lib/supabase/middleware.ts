import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const { data: { user } } = await supabase.auth.getUser();

  const publicPaths = ["/login", "/auth"];
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // 1. Belum login & bukan di halaman publik → redirect ke /login
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 2. Sudah login & buka /login → cek apakah email terdaftar di public.users
  //    Kalau TIDAK terdaftar → biarkan di /login (jangan redirect ke dashboard)
  //    Kalau terdaftar → redirect ke /dashboard
  if (user && request.nextUrl.pathname === "/login") {
    // Cek apakah email user ada di public.users
    const { data: dbUser } = await supabase
      .from("users")
      .select("id")
      .ilike("email", user.email ?? "")
      .eq("is_active", true)
      .maybeSingle();

    // Hanya redirect kalau user terdaftar
    if (dbUser) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    // Kalau tidak terdaftar, biarkan di /login
    return supabaseResponse;
  }

  // 3. Sudah login & buka halaman dashboard → biarkan (layout akan cek DB)
  return supabaseResponse;
}
