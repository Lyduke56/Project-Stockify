// app/api/payment-settings/route.ts
// GET  — public: fetch payment QR URL and GCash details for the client billing page
// PATCH — superadmin: update settings (qr url, name, number, instructions)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

const KEYS = [
  "payment_qr_url",
  "payment_gcash_name",
  "payment_gcash_number",
  "payment_instructions",
] as const;

  const supabase = createClient();
// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {


  
  const { data, error } = await supabase
    .from("stockify_settings")
    .select("key, value")
    .in("key", KEYS as unknown as string[]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const settings: Record<string, string | null> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  return NextResponse.json({ settings });
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  
  const body = await req.json().catch(() => ({}));

  const updates = KEYS.filter((k) => k in body).map((k) => ({
    key:        k,
    value:      body[k] ?? null,
    updated_at: new Date().toISOString(),
  }));

  if (updates.length === 0) {
    return NextResponse.json({ error: "No valid keys provided." }, { status: 400 });
  }

  const { error } = await supabase
    .from("stockify_settings")
    .upsert(updates, { onConflict: "key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// ── POST: upload QR image to storage ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const qrImage  = formData.get("qrImage") as File | null;

    if (!qrImage) {
      return NextResponse.json({ error: "qrImage is required." }, { status: 400 });
    }

    const ext      = qrImage.name.split(".").pop() ?? "png";
    const fileName = `stockify-payment-qr.${ext}`;
    const buffer   = Buffer.from(await qrImage.arrayBuffer());

    // Upsert so re-uploads replace the existing QR
    const { error: uploadErr } = await supabase.storage
      .from("payment-proofs")
      .upload(`qr/${fileName}`, buffer, {
        contentType: qrImage.type,
        upsert:      true,
      });

    if (uploadErr) {
      return NextResponse.json({ error: uploadErr.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("payment-proofs")
      .getPublicUrl(`qr/${fileName}`);

    // Persist URL to settings
    await supabase.from("stockify_settings").upsert(
      { key: "payment_qr_url", value: urlData.publicUrl, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

    return NextResponse.json({ success: true, url: urlData.publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Upload failed." }, { status: 500 });
  }
}