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
  const pathname = request.nextUrl.pathname;

  // === PRIORITY 1: Public paths — SELALU IZINKAN ===
  const publicPaths = ["/login", "/auth", "/maintenance"];
  const isPublicPath = publicPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isPublicPath) {
    if (pathname === "/login" && user) {
      const { data: dbUser } = await supabase
        .from("users")
        .select("role")
        .ilike("email", user.email ?? "")
        .eq("is_active", true)
        .maybeSingle();

      const { data: mode } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "app.maintenance_mode")
        .maybeSingle();
      const maintenanceMode = mode?.value === "true";

      const isAdmin = dbUser?.role === "admin";

      if (dbUser && (!maintenanceMode || isAdmin)) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
    return supabaseResponse;
  }

  // === PRIORITY 2: Belum login & bukan public → redirect ke /login ===
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // === PRIORITY 3: Sudah login & protected path → cek user & maintenance ===
  const { data: dbUser } = await supabase
    .from("users")
    .select("role")
    .ilike("email", user.email ?? "")
    .eq("is_active", true)
    .maybeSingle();

  if (!dbUser) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "user_not_registered");
    return NextResponse.redirect(url);
  }

  const { data: mode } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "app.maintenance_mode")
    .maybeSingle();

  const maintenanceMode = mode?.value === "true";
  const isAdmin = dbUser.role === "admin";

  if (maintenanceMode && !isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/maintenance";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
