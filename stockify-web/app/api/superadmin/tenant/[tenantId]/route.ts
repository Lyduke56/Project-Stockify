import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Extracts { bucket, path } from a Supabase Storage URL.
 * Supports both formats:
 *  - /storage/v1/object/public/<bucket>/<path>
 *  - /storage/v1/object/sign/<bucket>/<path>
 */
function parseStorageUrl(url: string | null): { bucket: string; path: string } | null {
  if (!url) return null;
  try {
    const { pathname } = new URL(url);
    const match = pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)/);
    if (!match) return null;
    return { bucket: match[1], path: match[2].split("?")[0] };
  } catch {
    return null;
  }
}

/**
 * Returns a 1-hour signed URL for a private Supabase Storage file,
 * or null if the URL is missing / unparseable.
 */
async function signUrl(rawUrl: string | null): Promise<string | null> {
  if (!rawUrl) return null;
  const parsed = parseStorageUrl(rawUrl);
  if (!parsed) return rawUrl;

  const { data, error } = await supabase.storage
    .from(parsed.bucket)
    .createSignedUrl(parsed.path, 60 * 60);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required." }, { status: 400 });
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select(
      `tenant_id,
       business_name,
       owner_full_name,
       owner_email,
       business_type,
       subscription_status,
       business_warehouse_address,
       owner_valid_id_url,
       business_permit_url,
       logo_url,
       created_at`
    )
    .eq("tenant_id", tenantId)
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("contact_number, gender, citizenship, address")
    .eq("tenant_id", tenantId)
    .eq("role", "Administrator")
    .maybeSingle();

  // Sign all private storage URLs in parallel
  const [signedValidId, signedPermit, signedLogo] = await Promise.all([
    signUrl(tenant.owner_valid_id_url),
    signUrl(tenant.business_permit_url),
    signUrl(tenant.logo_url),
  ]);

  return NextResponse.json({
    data: {
      ...tenant,
      owner_valid_id_url: signedValidId,
      business_permit_url: signedPermit,
      logo_url: signedLogo,
      contact_number: user?.contact_number ?? null,
      gender: user?.gender ?? null,
      citizenship: user?.citizenship ?? null,
      address: user?.address ?? null,
    },
  });
}