import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const body = await req.json();
    const { name, email, password, role } = body as {
      name: string;
      email: string;
      password: string;
      role: string;
    };

    // --- 1. Validate inputs ---
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // --- 2. Verify the logged-in owner/admin session ---
    const supabase: SupabaseClient = await createServerClient();
    const { data: { user: currentUser }, error: sessionError } = await supabase.auth.getUser();

    if (sessionError || !currentUser) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in again." },
        { status: 401 }
      );
    }

    // --- 3. Get the owner's tenant_id ---
    const { data: ownerData, error: ownerError } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (ownerError) {
      console.error("[create-employee] Owner lookup failed:", ownerError.message);
      return NextResponse.json(
        { error: "Could not retrieve your tenant information." },
        { status: 400 }
      );
    }

    const tenant_id = (ownerData as { tenant_id: string } | null)?.tenant_id;
    if (!tenant_id) {
      return NextResponse.json(
        { error: "No tenant associated with your account." },
        { status: 400 }
      );
    }

    // --- 4. Create the auth user ---
    const adminSupabase: SupabaseClient = createAdminClient();

    const { data: newAuthUser, error: createError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    // ✅ Check BEFORE doing anything else
    if (createError || !newAuthUser?.user) {
      console.error("[create-employee] Auth creation failed:", createError?.message);
      return NextResponse.json(
        { error: createError?.message ?? "Failed to create auth user." },
        { status: 400 }
      );
    }

    const newUserId = newAuthUser.user.id;

    // --- 5. Insert into public.users ---
    const { error: insertError } = await adminSupabase
      .from("users")
      .insert({
        user_id: newUserId,
        email,
        display_name: name,
        role,
        tenant_id,
        is_active: true,
      });

    if (insertError) {
      console.error("[create-employee] DB insert failed:", insertError.message);
      await adminSupabase.auth.admin.deleteUser(newUserId); // rollback
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    // --- 6. Send email ONLY after both auth + DB succeed ---
    const { error: emailError } = await resend.emails.send({
      from: "Your App <onboarding@yourdomain.com>", // ✅ must be a Resend-verified domain
      to: email,
      subject: "Your employee account is ready",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;">
          <h2 style="color:#385E31;">Welcome, ${name}!</h2>
          <p>Your employee account has been created with the role: <strong>${role}</strong>.</p>
          <p>You can now log in using your email and the password set by your administrator.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login"
             style="display:inline-block;margin-top:16px;padding:10px 24px;background:#385E31;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            Log In Now
          </a>
          <p style="margin-top:24px;font-size:12px;color:#888;">
            If you weren't expecting this, please ignore this email.
          </p>
        </div>
      `,
    });

    // ✅ Email failure is non-fatal — account already created, just log it
    if (emailError) {
      console.error("[create-employee] Email failed:", emailError.message);
    }

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[create-employee] Unexpected error:", message);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}