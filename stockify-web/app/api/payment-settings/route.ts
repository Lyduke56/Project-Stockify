// app/api/payment-settings/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ✅ Changed from ANON_KEY to SERVICE_ROLE_KEY to bypass RLS blocks
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const keysToFetch = [
      "payment_qr_url",
      "payment_gcash_name",
      "payment_gcash_number",
      "payment_instructions",
    ];

    // 1. Fetch raw rows from the database
    const { data, error } = await supabase
      .from("stockify_settings")
      .select("key, value")
      .in("key", keysToFetch);

    if (error) throw error;

    // 2. Transform array into a flat object
    const settingsObject = data.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {} as Record<string, string | null>);

    // 3. STORAGE BUCKET LOGIC (Using Signed URLs for Private Buckets)
    const qrValue = settingsObject.payment_qr_url;
    
    if (qrValue && !qrValue.startsWith("http")) {
      // Ask Supabase for a secure, signed URL valid for 1 hour (3600 seconds)
      const { data: signedUrlData, error: signErr } = await supabase
        .storage
        .from("payment-proofs")
        .createSignedUrl(qrValue, 3600);
        
      if (signErr) {
        console.error("Failed to sign URL:", signErr);
      } else if (signedUrlData) {
        // Replace the raw path with the secure, temporary image link
        settingsObject.payment_qr_url = signedUrlData.signedUrl;
      }
    }
    // 4. Return the fully resolved object
    return NextResponse.json({
      success: true,
      settings: settingsObject,
    });
    
  } catch (err: any) {
    console.error("[Payment Settings GET Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}