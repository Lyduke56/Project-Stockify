"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Toggles a product in the customer's favorites list.
 */
export async function toggleFavorite(productId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to save favorites." };

  // Check if already favorited
  const { data: existing } = await supabase
    .from("customer_favorites")
    .select("id")
    .eq("customer_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    // Remove it
    const { error } = await supabase
      .from("customer_favorites")
      .delete()
      .eq("customer_id", user.id)
      .eq("product_id", productId);
    return { favorited: false, error: error?.message ?? null };
  } else {
    // Add it
    const { error } = await supabase
      .from("customer_favorites")
      .insert({
        customer_id: user.id,
        product_id: productId
      });
    return { favorited: true, error: error?.message ?? null };
  }
}

/**
 * Fetches the list of favorited product IDs for the current user.
 */
export async function fetchFavorites() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("customer_favorites")
    .select("product_id")
    .eq("customer_id", user.id);

  if (error || !data) return [];
  return data.map((f: any) => f.product_id);
}

/**
 * Marks a notification as read.
 */
export async function markNotificationAsRead(notificationId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("customer_notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
  return { error: error?.message ?? null };
}

/**
 * Creates a notification for a customer (usually called by employee actions).
 */
export async function createCustomerNotification(params: {
  customerId: string;
  tenantId: string;
  title: string;
  message: string;
}) {
  const supabase = createClient();
  const { error } = await supabase
    .from("customer_notifications")
    .insert({
      customer_id: params.customerId,
      tenant_id:   params.tenantId,
      title:       params.title,
      message:     params.message,
      is_read:     false
    });
  return { error: error?.message ?? null };
}
