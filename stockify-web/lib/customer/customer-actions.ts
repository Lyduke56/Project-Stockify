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

export async function fetchReviews(productId: string, productType: 'fnb' | 'nfb') {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .select("*, users(display_name)")
    .eq("product_id", productId)
    .eq("product_type", productType)
    .order("created_at", { ascending: false });
  return { data, error: error?.message ?? null };
}

export async function submitReview(params: {
  tenantId: string;
  productId: string;
  productType: 'fnb' | 'nfb';
  rating: number;
  comment?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to leave a review." };

  const { error } = await supabase
    .from("product_reviews")
    .insert({
      tenant_id: params.tenantId,
      user_id: user.id,
      product_id: params.productId,
      product_type: params.productType,
      rating: params.rating,
      comment: params.comment,
    });
  return { error: error?.message ?? null };
}

export async function deleteReview(reviewId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("product_reviews")
    .delete()
    .eq("review_id", reviewId);
  return { error: error?.message ?? null };
}

export async function updateReview(reviewId: string, rating: number, comment?: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("product_reviews")
    .update({ rating, comment, updated_at: new Date().toISOString() })
    .eq("review_id", reviewId);
  return { error: error?.message ?? null };
}

export async function fetchTopRatedProduct(tenantId: string, productType?: 'fnb' | 'nfb') {
  const supabase = createClient();
  let query = supabase
    .from("product_reviews")
    .select("product_id, product_type, rating")
    .eq("tenant_id", tenantId);
    
  if (productType) {
    query = query.eq("product_type", productType);
  }
  
  const { data: reviews, error } = await query;
    
  if (error || !reviews || reviews.length === 0) return null;
  
  const summary: Record<string, { sum: number, count: number, type: string }> = {};
  reviews.forEach((r: any) => {
    const key = r.product_id;
    if (!summary[key]) summary[key] = { sum: 0, count: 0, type: r.product_type };
    summary[key].sum += r.rating;
    summary[key].count += 1;
  });
  
  let topProductId = null;
  let topAvg = 0;
  let topType = '';
  
  for (const id in summary) {
    const avg = summary[id].sum / summary[id].count;
    if (avg > topAvg) {
      topAvg = avg;
      topProductId = id;
      topType = summary[id].type;
    }
  }
  
  if (!topProductId) return null;
  
  const table = topType === 'fnb' ? 'products' : 'nfb_products';
  const { data: product } = await supabase
    .from(table)
    .select("*")
    .eq("product_id", topProductId)
    .single();
    
  return product ? { ...product, average_rating: topAvg, total_reviews: summary[topProductId].count, product_type: topType } : null;
}
