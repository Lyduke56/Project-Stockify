// app/api/client/payment-submit/route.ts
// POST — Tenant admin submits proof of payment.
//   • Accepts multipart/form-data with: proofImage, tenantId, submittedBy, amountDeclared, remarksTenant
//   • Uploads image to Supabase Storage "payment-proofs" bucket
//   • Inserts a row into payment_submissions
//
// GET  — Fetch this tenant's own submissions (for the client billing page)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData       = await req.formData();
    const proofImage     = formData.get("proofImage")     as File | null;
    const tenantId       = formData.get("tenantId")       as string | null;
    const submittedBy    = formData.get("submittedBy")    as string | null;
    const amountDeclared = formData.get("amountDeclared") as string | null;
    const remarksTenant  = formData.get("remarksTenant")  as string | null;
    const subscriptionId = formData.get("subscriptionId") as string | null;

    if (!proofImage || !tenantId) {
      return NextResponse.json(
        { error: "proofImage and tenantId are required." },
        { status: 400 }
      );
    }

    // Validate it's an image
    if (!proofImage.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are accepted as proof of payment." },
        { status: 400 }
      );
    }

    // Check if tenant already has a pending submission (prevent duplicates)
    const { data: existing } = await supabase
      .from("payment_submissions")
      .select("submission_id")
      .eq("tenant_id", tenantId)
      .eq("status", "Pending")
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "You already have a pending payment submission. Please wait for it to be reviewed." },
        { status: 409 }
      );
    }

    // Upload to Supabase Storage
    const ext      = proofImage.name.split(".").pop() ?? "jpg";
    const fileName = `${tenantId}/${Date.now()}.${ext}`;
    const buffer   = Buffer.from(await proofImage.arrayBuffer());

    const { error: uploadErr } = await supabase.storage
      .from("payment-proofs")
      .upload(fileName, buffer, {
        contentType: proofImage.type,
        upsert:      false,
      });

    if (uploadErr) {
      return NextResponse.json({ error: uploadErr.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("payment-proofs")
      .getPublicUrl(fileName);

    const proofUrl = urlData.publicUrl;

    // Insert submission record
    const { data: submission, error: insErr } = await supabase
      .from("payment_submissions")
      .insert({
        tenant_id:       tenantId,
        subscription_id: subscriptionId ?? null,
        submitted_by:    submittedBy    ?? null,
        proof_url:       proofUrl,
        amount_declared: amountDeclared ? parseFloat(amountDeclared) : null,
        remarks_tenant:  remarksTenant?.trim() || null,
        status:          "Pending",
      })
      .select("submission_id, status, created_at")
      .single();

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, submission });
  } catch (err: any) {
    console.error("[payment-submit] POST error:", err);
    return NextResponse.json({ error: err.message ?? "Unexpected error." }, { status: 500 });
  }
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("payment_submissions")
    .select(`
      submission_id,
      proof_url,
      amount_declared,
      remarks_tenant,
      remarks_admin,
      status,
      reviewed_at,
      created_at,
      subscription_id
    `)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ submissions: data ?? [] });
}