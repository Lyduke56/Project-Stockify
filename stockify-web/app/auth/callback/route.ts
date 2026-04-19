import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // Exchange the code for a session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.user) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Check is_active
  const { data: userData } = await supabase
    .from("users")
    .select("is_active")
    .eq("user_id", data.user.id)
    .single();

  // Always sign them out after confirming —
  // they should not get a live session yet
  await supabase.auth.signOut();

  if (!userData?.is_active) {
    // Email confirmed but still awaiting superadmin
    return NextResponse.redirect(new URL("/auth/account/waiting-approved", req.url));
  }

  // Already active (edge case) — send to landing page to login normally
  return NextResponse.redirect(new URL("/", req.url));
}