import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, 
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      firstName,
      lastName,
      middleName,
      suffix,
      gender,
      contactNumber,
      address,
      citizenship,
      profilePictureUrl,
      businessName,
      businessType,
      ownerFullName,
      businessWarehouseAddress,
      ownerValidIdUrl,
      businessPermitUrl,
      logoUrl,
    } = body;

    // --- Check if email already registered ---
    const { data: existingTenant } = await supabaseAdmin
      .from("tenants")
      .select("tenant_id")
      .eq("owner_email", email)
      .maybeSingle();

    if (existingTenant) {
      return NextResponse.json(
        { error: "This email is already registered." },
        { status: 409 }
      );
    }

    // --- Create auth user ---
   const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/account/waiting-approved`,
        },
      });
      
      if (authError) {
        if (authError.status === 429) {
          return NextResponse.json(
            { error: "Too many signup attempts. Please wait a few minutes." },
            { status: 429 }
          );
        }
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      const authUserId = authData.user?.id;
      if (!authUserId) {
        return NextResponse.json(
          { error: "Failed to create account. The email may already be in use." },
          { status: 400 }
        );
      }

    // --- Insert Tenant ---
    const { data: tenantData, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        business_name: businessName,       // character varying(255)
        owner_email: email,                // character varying(255)
        business_type: businessType || null, // business_type_enum
        owner_full_name: ownerFullName,    // text
        business_warehouse_address: businessWarehouseAddress, // text
        owner_valid_id_url: ownerValidIdUrl || null, // text
        business_permit_url: businessPermitUrl || null, // text
        logo_url: logoUrl || null,         // text (after running the ALTER)
        is_active: false,
        subscription_status: "Pending",
      })
      .select("tenant_id")
      .single();

    if (tenantError) {
      // Rollback: delete the auth user we just created
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return NextResponse.json({ error: tenantError.message }, { status: 500 });
    }

    const tenantId = tenantData.tenant_id;

    // --- Insert User ---
    const { error: userError } = await supabaseAdmin.from("users").insert({
        user_id: authUserId,               // uuid
        tenant_id: tenantId,               // uuid
        email,                             // character varying(255)
        role: "Administrator",             // user_role_enum
        display_name: `${firstName} ${lastName}`, // character varying(255)
        first_name: firstName,             // text
        last_name: lastName,               // text
        middle_name: middleName || null,   // text
        suffix: suffix || null,            // text
        gender: gender || null,            // text
        contact_number: contactNumber || null, // character varying(50)
        address: address || null,          // text
        citizenship: citizenship || null,  // text
        profile_picture_url: profilePictureUrl || null, // text
        is_active: false,
      });

    if (userError) {
      // Rollback both
      await supabaseAdmin.from("tenants").delete().eq("tenant_id", tenantId);
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong." },
      { status: 500 }
    );
  }
}
