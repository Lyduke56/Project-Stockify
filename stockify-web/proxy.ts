import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
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

  const { data: { user } } = await supabase.auth.getUser();

  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith("/superadmin") || 
    request.nextUrl.pathname.includes("/administrator") ||
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.includes("/employee");

  // 1. Handle Unauthenticated Access
  if (!user && isProtectedRoute) {
    const redirectResponse = NextResponse.redirect(new URL("/", request.url));
    // Kill the cache on the redirect itself to stop "Back" button access
    redirectResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    redirectResponse.headers.set('Pragma', 'no-cache');
    redirectResponse.headers.set('Expires', '0');
    return redirectResponse;
  }

  // 2. Handle Authenticated Access (Add this part!)
  // This tells the browser: "Even if I am logged in, do not cache this page snapshot."
  if (isProtectedRoute) {
    supabaseResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    supabaseResponse.headers.set('Pragma', 'no-cache');
    supabaseResponse.headers.set('Expires', '0');
  }

  return supabaseResponse;
}

export const config = {
  // Added "Dashboard Icons" to the exclusion list so assets load even if not logged in
  matcher: ["/((?!_next/static|_next/image|Dashboard Icons|favicon.ico).*)"],
};