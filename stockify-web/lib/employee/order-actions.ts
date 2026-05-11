"use client";

import { createClient } from "@/lib/supabase/client";

export type FulfillmentStatus = "Pending" | "Processing" | "Dispatched" | "Received" | "Cancelled";
export type PaymentMethod    = "QR code" | "Cash-on-Delivery";
export type PaymentStatus    = "Pending" | "Confirmed";

export interface OrderItem {
  order_item_id: string;
  item_id:       string;
  item_type:     string;
  item_name:     string;
  size_label:    string | null;
  quantity:      number;
  unit_price:    number;
}

export interface Order {
  order_id:           string;
  tenant_id:          string;
  customer_id:        string;
  customer_name:      string;
  fulfillment_status: FulfillmentStatus;
  payment_method:     PaymentMethod;
  payment_status:     PaymentStatus;
  total_amount:       number;
  cancel_reason:      string | null;
  created_at:         string;
  items?:             OrderItem[];
}

export interface Transaction {
  transaction_id: string;
  order_id:       string;
  tenant_id:      string;
  customer_name:  string;
  total_amount:   number;
  payment_method: string;
  item_count:     number;
  completed_at:   string;
}

export interface AuditLog {
  log_id:      string;
  tenant_id:   string;
  user_id:     string;
  user_name:   string;
  action:      string;
  entity_type: string;
  entity_id:   string | null;
  entity_name: string | null;
  details:     Record<string, unknown> | null;
  created_at:  string;
}

// ─── Fetch All Orders for a Tenant ────────────────────────────────────────────

export async function fetchOrders(tenantId: string): Promise<Order[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      order_id, tenant_id, customer_id, fulfillment_status,
      payment_method, payment_status, total_amount, cancel_reason, created_at,
      users!orders_customer_id_fkey ( first_name, last_name, display_name )
    `)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("fetchOrders error:", error);
    return [];
  }

  return data.map((o) => {
    const u = o.users as any;
    const customerName =
      u?.first_name && u?.last_name
        ? `${u.first_name} ${u.last_name}`
        : u?.display_name ?? "Unknown";

    return {
      order_id:           o.order_id,
      tenant_id:          o.tenant_id,
      customer_id:        o.customer_id,
      customer_name:      customerName,
      fulfillment_status: o.fulfillment_status as FulfillmentStatus,
      payment_method:     o.payment_method as PaymentMethod,
      payment_status:     o.payment_status as PaymentStatus,
      total_amount:       Number(o.total_amount),
      cancel_reason:      o.cancel_reason ?? null,
      created_at:         o.created_at,
    };
  });
}

// ─── Fetch Order Items (resilient) ────────────────────────────────────────────

export async function fetchOrderItems(orderId: string): Promise<OrderItem[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("order_items")
    .select("order_item_id, item_id, item_type, item_name, size_label, quantity, unit_price")
    .eq("order_id", orderId);

  if (!error && data) {
    return data.map((i) => ({
      order_item_id: i.order_item_id,
      item_id:       i.item_id,
      item_type:     i.item_type  ?? "unknown",
      item_name:     i.item_name  ?? "",
      size_label:    i.size_label ?? null,
      quantity:      i.quantity,
      unit_price:    Number(i.unit_price),
    }));
  }

  // Fallback — columns not yet migrated
  console.warn("[fetchOrderItems] Falling back to base columns:", error?.message);
  const { data: fallback, error: fbErr } = await supabase
    .from("order_items")
    .select("order_item_id, item_id, quantity, unit_price")
    .eq("order_id", orderId);

  if (fbErr || !fallback) { console.error("fetchOrderItems fallback error:", fbErr); return []; }

  return fallback.map((i) => ({
    order_item_id: i.order_item_id,
    item_id:       i.item_id,
    item_type:     "unknown",
    item_name:     "",
    size_label:    null,
    quantity:      i.quantity,
    unit_price:    Number(i.unit_price),
  }));
}

// ─── Update Fulfillment Status ─────────────────────────────────────────────────

export async function updateFulfillmentStatus(
  orderId: string,
  status: FulfillmentStatus
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("orders")
    .update({ fulfillment_status: status })
    .eq("order_id", orderId);
  return { error: error?.message ?? null };
}

// ─── Cancel Order (with optional reason) ──────────────────────────────────────

export async function cancelOrder(
  orderId: string,
  reason?: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("orders")
    .update({
      fulfillment_status: "Cancelled",
      cancel_reason: reason?.trim() || null,
    })
    .eq("order_id", orderId);
  return { error: error?.message ?? null };
}

// ─── Process & Complete Order (stock deduction + transaction record) ───────────

export async function processAndCompleteOrder(
  orderId: string,
  tenantId: string
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const items = await fetchOrderItems(orderId);
  if (items.length === 0) return { error: "No items found for this order." };

  for (const item of items) {
    if (item.item_type === "unknown") continue;
    const qty = item.quantity;

    if (item.item_type === "nfb_single") {
      const { data: prod } = await supabase.from("nfb_products").select("quantity").eq("product_id", item.item_id).eq("tenant_id", tenantId).single();
      if (!prod) return { error: `Product not found: ${item.item_name}` };
      const newQty = prod.quantity - qty;
      if (newQty < 0) return { error: `Insufficient stock for: ${item.item_name}` };
      const { error } = await supabase.from("nfb_products").update({ quantity: newQty }).eq("product_id", item.item_id);
      if (error) return { error: error.message };

    } else if (item.item_type === "nfb_variant") {
      const { data: opt } = await supabase.from("nfb_variant_options").select("stock").eq("option_id", item.item_id).single();
      if (!opt) return { error: `Variant not found: ${item.item_name}` };
      const newStock = opt.stock - qty;
      if (newStock < 0) return { error: `Insufficient stock: ${item.item_name}` };
      const { error } = await supabase.from("nfb_variant_options").update({ stock: newStock }).eq("option_id", item.item_id);
      if (error) return { error: error.message };

    } else if (item.item_type === "fnb_single") {
      const { data: recipes } = await supabase.from("product_recipes").select("item_id, amount").eq("product_id", item.item_id).eq("tenant_id", tenantId).is("size_label", null);
      if (recipes) {
        for (const recipe of recipes) {
          const { data: inv } = await supabase.from("fnb_inventory_items").select("stock").eq("item_id", recipe.item_id).single();
          if (!inv) continue;
          const newStock = inv.stock - Number(recipe.amount) * qty;
          if (newStock < 0) return { error: `Insufficient ingredient stock for: ${item.item_name}` };
          const { error } = await supabase.from("fnb_inventory_items").update({ stock: Math.floor(newStock) }).eq("item_id", recipe.item_id);
          if (error) return { error: error.message };
        }
      }

    } else if (item.item_type === "fnb_size") {
      const { data: recipes } = await supabase.from("product_recipes").select("item_id, amount").eq("product_id", item.item_id).eq("tenant_id", tenantId).eq("size_label", item.size_label ?? "");
      if (recipes) {
        for (const recipe of recipes) {
          const { data: inv } = await supabase.from("fnb_inventory_items").select("stock").eq("item_id", recipe.item_id).single();
          if (!inv) continue;
          const newStock = inv.stock - Number(recipe.amount) * qty;
          if (newStock < 0) return { error: `Insufficient ingredient stock for: ${item.item_name} (${item.size_label})` };
          const { error } = await supabase.from("fnb_inventory_items").update({ stock: Math.floor(newStock) }).eq("item_id", recipe.item_id);
          if (error) return { error: error.message };
        }
      }
    }
  }

  // Mark order as Received + Confirmed
  const { data: orderData, error: statusError } = await supabase
    .from("orders")
    .update({ fulfillment_status: "Received", payment_status: "Confirmed" })
    .eq("order_id", orderId)
    .select("order_id, tenant_id, customer_id, total_amount, payment_method, users!orders_customer_id_fkey(first_name, last_name, display_name)")
    .single();

  if (statusError) return { error: statusError.message };

  // Insert transaction record
  if (orderData) {
    const u = orderData.users as any;
    const customerName = u?.first_name && u?.last_name
      ? `${u.first_name} ${u.last_name}`
      : u?.display_name ?? "Customer";

    await supabase.from("transactions").insert({
      order_id:       orderData.order_id,
      tenant_id:      orderData.tenant_id,
      customer_id:    orderData.customer_id,
      customer_name:  customerName,
      total_amount:   Number(orderData.total_amount),
      payment_method: orderData.payment_method,
      item_count:     items.length,
    });
  }

  return { error: null };
}

// ─── Fetch Transactions ────────────────────────────────────────────────────────

export async function fetchTransactions(tenantId: string): Promise<Transaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("transaction_id, order_id, tenant_id, customer_name, total_amount, payment_method, item_count, completed_at")
    .eq("tenant_id", tenantId)
    .order("completed_at", { ascending: false });

  if (error || !data) { console.error("fetchTransactions error:", error); return []; }
  return data.map((t) => ({
    transaction_id: t.transaction_id,
    order_id:       t.order_id,
    tenant_id:      t.tenant_id,
    customer_name:  t.customer_name,
    total_amount:   Number(t.total_amount),
    payment_method: t.payment_method,
    item_count:     t.item_count,
    completed_at:   t.completed_at,
  }));
}

// ─── Audit Log ─────────────────────────────────────────────────────────────────

export async function logAuditEvent(params: {
  tenantId:    string;
  userId:      string;
  userName:    string;
  action:      string;
  entityType:  string;
  entityId?:   string;
  entityName?: string;
  details?:    Record<string, unknown>;
}): Promise<void> {
  const supabase = createClient();
  await supabase.from("tenant_audit_logs").insert({
    tenant_id:   params.tenantId,
    user_id:     params.userId,
    user_name:   params.userName,
    action:      params.action,
    entity_type: params.entityType,
    entity_id:   params.entityId   ?? null,
    entity_name: params.entityName ?? null,
    details:     params.details    ?? null,
  });
}

export async function fetchAuditLogs(tenantId: string): Promise<AuditLog[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tenant_audit_logs")
    .select("log_id, tenant_id, user_id, user_name, action, entity_type, entity_id, entity_name, details, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !data) { console.error("fetchAuditLogs error:", error); return []; }
  return data as AuditLog[];
}

// ─── Place a New Order ─────────────────────────────────────────────────────────

export interface PlaceOrderPayload {
  tenant_id:      string;
  customer_id:    string;
  payment_method: PaymentMethod;
  total_amount:   number;
  items: {
    item_id:    string;
    item_type:  string;
    item_name:  string;
    size_label: string | null;
    quantity:   number;
    unit_price: number;
  }[];
}

export async function placeOrder(
  payload: PlaceOrderPayload
): Promise<{ order_id: string | null; error: string | null }> {
  const supabase = createClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      tenant_id:          payload.tenant_id,
      customer_id:        payload.customer_id,
      payment_method:     payload.payment_method,
      payment_status:     "Pending",
      fulfillment_status: "Pending",
      total_amount:       payload.total_amount,
    })
    .select("order_id")
    .single();

  if (orderError || !order) {
    console.error("placeOrder insert error:", orderError);
    return { order_id: null, error: orderError?.message ?? "Failed to create order." };
  }

  // Try with extended columns
  const richItems = payload.items.map((item) => ({
    order_id:   order.order_id,
    item_id:    item.item_id,
    item_type:  item.item_type,
    item_name:  item.item_name,
    size_label: item.size_label ?? null,
    quantity:   item.quantity,
    unit_price: item.unit_price,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(richItems);
  if (!itemsError) return { order_id: order.order_id, error: null };

  // Fallback — base columns only
  console.warn("[placeOrder] Using base insert:", itemsError.message);
  const baseItems = payload.items.map((item) => ({
    order_id:   order.order_id,
    item_id:    item.item_id,
    quantity:   item.quantity,
    unit_price: item.unit_price,
  }));

  const { error: baseError } = await supabase.from("order_items").insert(baseItems);
  if (baseError) {
    await supabase.from("orders").delete().eq("order_id", order.order_id);
    return { order_id: null, error: baseError.message };
  }

  return { order_id: order.order_id, error: null };
}
