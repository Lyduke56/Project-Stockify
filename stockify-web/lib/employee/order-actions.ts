"use client";

import { createClient } from "@/lib/supabase/client";
import { recalculateMaxYield, validateInventoryForOrder, recalculateNfbProductQuantity } from "@/lib/shared/inventory-utils";

// ─── Shared audit context helper ──────────────────────────────────────────────
// Returns userId + userName for the current session. Fire-and-forget safe.
async function getAuditContext(): Promise<{ userId: string; userName: string } | null> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: u } = await supabase
      .from("users")
      .select("first_name, last_name, display_name")
      .eq("user_id", user.id)
      .single();
    const userName =
      u?.first_name && u?.last_name
        ? `${u.first_name} ${u.last_name}`
        : u?.display_name ?? user.email ?? "Unknown";
    return { userId: user.id, userName };
  } catch { return null; }
}

export type FulfillmentStatus = "Pending" | "Processing" | "Dispatched" | "Received" | "Cancelled" | "Reported";
export type PaymentMethod    = "QR Code" | "Cash-on-Delivery";
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
  // New columns
  proof_of_payment_url?: string | null;
  delivery_proof_url?:   string | null;
  deliverer_name?:       string | null;
  delivery_id?:          string | null;
  customer_confirmed_received?: boolean;
  received_at?:          string | null;
  stock_deducted?:       boolean;
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
      proof_of_payment_url, delivery_proof_url, deliverer_name, delivery_id,
      customer_confirmed_received, received_at, stock_deducted,
      users!orders_customer_id_fkey ( first_name, last_name, display_name )
    `)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("fetchOrders error:", error);
    return [];
  }

  return data.map((o: any) => {
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
      proof_of_payment_url: o.proof_of_payment_url,
      delivery_proof_url:   o.delivery_proof_url,
      deliverer_name:       o.deliverer_name,
      delivery_id:          o.delivery_id,
      customer_confirmed_received: o.customer_confirmed_received,
      received_at:          o.received_at,
    };
  });
}

export async function fetchOrderById(orderId: string): Promise<Order | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      order_id, tenant_id, customer_id, fulfillment_status,
      payment_method, payment_status, total_amount, cancel_reason, created_at,
      proof_of_payment_url, delivery_proof_url, deliverer_name, delivery_id,
      customer_confirmed_received, received_at, stock_deducted,
      users!orders_customer_id_fkey ( first_name, last_name, display_name )
    `)
    .eq("order_id", orderId)
    .single();

  if (error || !data) { console.error("fetchOrderById error:", error); return null; }

  const u = data.users as any;
  const customerName = u?.first_name && u?.last_name
    ? `${u.first_name} ${u.last_name}`
    : u?.display_name ?? "Unknown Customer";

  return {
    order_id:             data.order_id,
    tenant_id:            data.tenant_id,
    customer_id:          data.customer_id,
    customer_name:        customerName,
    fulfillment_status:   data.fulfillment_status,
    payment_method:       data.payment_method,
    payment_status:       data.payment_status,
    total_amount:         Number(data.total_amount),
    cancel_reason:        data.cancel_reason,
    created_at:           data.created_at,
    proof_of_payment_url: data.proof_of_payment_url,
    delivery_proof_url:   data.delivery_proof_url,
    deliverer_name:       data.deliverer_name,
    delivery_id:          data.delivery_id,
    customer_confirmed_received: data.customer_confirmed_received,
    received_at:          data.received_at,
  };
}

// ─── Fetch Order Items (resilient) ────────────────────────────────────────────

export async function fetchOrderItems(orderId: string): Promise<OrderItem[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("order_items")
    .select("order_item_id, item_id, item_type, item_name, size_label, quantity, unit_price")
    .eq("order_id", orderId);

  if (!error && data) {
    return data.map((i: any) => ({
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

  return fallback.map((i: any) => ({
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
  status: FulfillmentStatus,
  extraData?: {
    deliverer_name?: string | null;
    delivery_id?: string | null;
    delivery_proof_url?: string | null;
    cancel_reason?: string | null;
    remarks?: string | null;
  }
): Promise<{ error: string | null }> {
  const supabase = createClient();

  // Fetch current order state
  const { data: ord, error: fetchErr } = await supabase
    .from("orders")
    .select("tenant_id, customer_id, fulfillment_status, stock_deducted, users!orders_customer_id_fkey(display_name, first_name, last_name)")
    .eq("order_id", orderId)
    .single();

  if (fetchErr || !ord) return { error: fetchErr?.message ?? "Order not found." };

  // 1. If moving to "Dispatched" and stock hasn't been deducted yet
  if (status === "Dispatched" && !ord.stock_deducted) {
    const { error: deductErr } = await deductOrderStock(orderId, ord.tenant_id);
    if (deductErr) return { error: deductErr };
    
    // Mark as deducted in the same update
    await supabase.from("orders").update({ stock_deducted: true }).eq("order_id", orderId);
  }

  const { error } = await supabase
    .from("orders")
    .update({ 
      fulfillment_status: status,
      ...extraData
    })
    .eq("order_id", orderId);

  if (status === "Received" && !error) {
    // Trigger full completion logic (transaction record, etc)
    const { error: completionError } = await processAndCompleteOrder(orderId, extraData?.remarks ?? "");
    if (completionError) return { error: completionError };
  }

  // Fire-and-forget audit log & notifications
  if (!error) {
    // 1. Create Customer Notification
    let notifTitle = "";
    let notifMsg = "";
    if (status === "Processing") {
      notifTitle = "Order Processing";
      notifMsg = `Your order #${orderId.slice(0, 8).toUpperCase()} is now being prepared!`;
    } else if (status === "Dispatched") {
      notifTitle = "Order Dispatched";
      notifMsg = `Your order #${orderId.slice(0, 8).toUpperCase()} has been dispatched. ${extraData?.deliverer_name ? `Rider: ${extraData.deliverer_name}` : ""}`;
    }

    if (notifTitle) {
      supabase.from("customer_notifications").insert({
        customer_id: ord.customer_id,
        tenant_id:   ord.tenant_id,
        order_id:    orderId,
        title:       notifTitle,
        message:     notifMsg,
        notification_type: `ORDER_${status.toUpperCase()}`
      }).then(({ error: nErr }: { error: any }) => {
        if (nErr) console.error("[updateFulfillmentStatus] Notif error:", nErr);
      });
    }

    // 2. Audit Log
    getAuditContext().then((ctx: { userId: string; userName: string } | null) => {
      if (!ctx) return;
      const u = ord.users as any;
      const customerName = u?.first_name && u?.last_name
        ? `${u.first_name} ${u.last_name}` : u?.display_name ?? "Customer";
      logAuditEvent({
        tenantId:   ord.tenant_id,
        userId:     ctx.userId,
        userName:   ctx.userName,
        action:     `STATUS_${status.toUpperCase()}`,
        entityType: "order",
        entityId:   orderId,
        entityName: `Order #${orderId.slice(0, 8).toUpperCase()} (${customerName})`,
        details:    { new_status: status },
      });
    });
  }

  return { error: error?.message ?? null };
}

// ─── Cancel Order (with optional reason) ──────────────────────────────────────

export async function cancelOrder(
  orderId: string,
  reason?: string
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { data: ord, error: fetchErr } = await supabase
    .from("orders")
    .select("tenant_id, customer_id, fulfillment_status, stock_deducted, users!orders_customer_id_fkey(display_name, first_name, last_name)")
    .eq("order_id", orderId)
    .single();

  if (fetchErr || !ord) return { error: fetchErr?.message ?? "Order not found." };

  // If cancelling an order that was already Dispatched, Received, or Reported, restore stock
  if (ord.fulfillment_status === "Dispatched" || ord.fulfillment_status === "Received" || ord.fulfillment_status === "Reported") {
    console.log(`[cancelOrder] Restoring stock for ${ord.fulfillment_status} order:`, orderId);
    await restoreOrderStock(orderId, ord.tenant_id);
    // Reset flag
    await supabase.from("orders").update({ stock_deducted: false }).eq("order_id", orderId);
  }

  const { error } = await supabase
    .from("orders")
    .update({ fulfillment_status: "Cancelled", cancel_reason: reason?.trim() || null })
    .eq("order_id", orderId);

  if (!error && ord) {
    // Notify customer about cancellation
    const { error: notifError } = await supabase.from("customer_notifications").insert({
      customer_id: ord.customer_id,
      tenant_id:   ord.tenant_id,
      title:       "Order Cancelled",
      message:     `Your order #${orderId.slice(0, 8).toUpperCase()} has been cancelled. ${reason ? `Reason: ${reason}` : ""}`,
    });
    if (notifError) {
      console.error("[cancelOrder] Notification failed:", notifError);
    }

    getAuditContext().then((ctx: any) => {
      if (!ctx) return;
      const u = ord.users as any;
      const customerName = u?.first_name && u?.last_name
        ? `${u.first_name} ${u.last_name}` : u?.display_name ?? "Customer";
      logAuditEvent({
        tenantId:   ord.tenant_id,
        userId:     ctx.userId,
        userName:   ctx.userName,
        action:     "CANCEL",
        entityType: "order",
        entityId:   orderId,
        entityName: `Order #${orderId.slice(0, 8).toUpperCase()} (${customerName})`,
        details:    { reason: reason || "No reason provided" },
      });
    });
  }

  return { error: error?.message ?? null };
}

export async function deductOrderStock(orderId: string, tenantId: string) {
  const supabase = createClient();
  const items = await fetchOrderItems(orderId);
  if (!items || items.length === 0) return { error: "No items found" };

  console.log(`[deductOrderStock] Pre-checking stock for ${items.length} items...`);

  // --- PHASE 1: PRE-CHECK (Verify availability for ALL items) ---
  for (const item of items) {
    let type = item.item_type;
    const qty = item.quantity;

    // Guess type if unknown (For F&B system, we only care about recipes and direct inventory)
    if (type === "unknown") {
      const { data: fnbR } = await supabase.from("product_recipes").select("product_id").eq("product_id", item.item_id).limit(1).single();
      if (fnbR) type = "fnb_single";
      else {
        const { data: fnbI } = await supabase.from("fnb_inventory_items").select("item_id").eq("item_id", item.item_id).single();
        if (fnbI) type = "fnb_inventory";
      }
    }

    if (type === "fnb_inventory") {
      const { data: inv } = await supabase.from("fnb_inventory_items").select("name, stock").eq("item_id", item.item_id).single();
      if (!inv || inv.stock < qty) return { error: `Insufficient stock for ${inv?.name || "Ingredient"}` };
    } else if (type === "fnb_single" || type === "fnb_size") {
      let productId = item.item_id;
      let sizeLabel = item.size_label;

      if (type === "fnb_size") {
        const { data: sd } = await supabase.from("product_sizes").select("product_id, label").eq("size_id", item.item_id).single();
        if (sd) { productId = sd.product_id; sizeLabel = sd.label; }
      }

      const { data: recipes } = sizeLabel 
        ? await supabase.from("product_recipes").select("item_id, amount").eq("product_id", productId).eq("size_label", sizeLabel)
        : await supabase.from("product_recipes").select("item_id, amount").eq("product_id", productId).is("size_label", null);

      if (recipes && recipes.length > 0) {
        for (const r of recipes) {
          const { data: inv } = await supabase.from("fnb_inventory_items").select("name, stock").eq("item_id", r.item_id).single();
          const needed = Number(r.amount) * qty;
          if (!inv || inv.stock < needed) return { error: `Insufficient ingredient: ${inv?.name || "Unknown"} (Need ${needed}, Have ${inv?.stock || 0})` };
        }
      }
    }
  }

  console.log(`[deductOrderStock] Pre-check passed. Proceeding with deduction...`);

  // --- PHASE 2: DEDUCTION (Actually update the database) ---
  for (const item of items) {
    let type = item.item_type;
    const qty = item.quantity;

    // RESILIENCE: If type is unknown, try to guess it (F&B Only)
    if (type === "unknown") {
      const { data: fnbR } = await supabase.from("product_recipes").select("product_id").eq("product_id", item.item_id).limit(1).single();
      if (fnbR) { type = "fnb_single"; }
      else {
        const { data: fnbI } = await supabase.from("fnb_inventory_items").select("item_id").eq("item_id", item.item_id).single();
        if (fnbI) { type = "fnb_inventory"; }
      }
    }

    if (type === "unknown") {
      console.error(`[deductOrderStock] Could not identify item: ${item.item_id}`);
      continue;
    }

    // --- DEDUCTION LOGIC ---
    if (type === "nfb_single") {
      const { data: prod } = await supabase.from("nfb_products").select("quantity").eq("product_id", item.item_id).eq("tenant_id", tenantId).single();
      if (prod) {
        console.log(`[deductOrderStock] Deducting ${qty} from nfb_products: ${item.item_id}`);
        await supabase.from("nfb_products").update({ quantity: Math.max(0, prod.quantity - qty) }).eq("product_id", item.item_id);
      }
    } else if (type === "nfb_variant") {
      const { data: opt } = await supabase.from("nfb_variant_options").select("product_id, stock").eq("option_id", item.item_id).single();
      if (opt) {
        console.log(`[deductOrderStock] Deducting ${qty} from nfb_variant_options: ${item.item_id}`);
        await supabase.from("nfb_variant_options").update({ stock: Math.max(0, opt.stock - qty) }).eq("option_id", item.item_id);
        // Sync parent product total quantity
        await recalculateNfbProductQuantity(opt.product_id, tenantId);
      }
    } else if (type === "fnb_inventory") {
      const { data: inv } = await supabase.from("fnb_inventory_items").select("stock").eq("item_id", item.item_id).single();
      if (inv) {
        console.log(`[deductOrderStock] Deducting ${qty} from fnb_inventory_items (direct): ${item.item_id}`);
        const { error } = await supabase.from("fnb_inventory_items").update({ stock: inv.stock - qty }).eq("item_id", item.item_id);
        if (error) console.error("[deductOrderStock] fnb_inventory_items direct update error:", error);
      }
    } else if (type === "fnb_single" || type === "fnb_size") {
      let productId = item.item_id;
      let sizeLabel = item.size_label;

      // Resolve parent product and size label for variants
      if (type === "fnb_size") {
        const { data: sizeData } = await supabase
          .from("product_sizes")
          .select("product_id, label")
          .eq("size_id", item.item_id)
          .single();
        
        if (sizeData) {
          productId = sizeData.product_id;
          sizeLabel = sizeData.label;
          console.log(`[deductOrderStock] Resolved fnb_size ${item.item_id} to Product: ${productId}, Size: ${sizeLabel}`);
        }
      }

      const query = supabase.from("product_recipes").select("item_id, amount").eq("product_id", productId).eq("tenant_id", tenantId);
      const { data: recipes } = sizeLabel ? await query.eq("size_label", sizeLabel) : await query.is("size_label", null);
      
      if (recipes && recipes.length > 0) {
        for (const recipe of recipes) {
          const { data: inv } = await supabase.from("fnb_inventory_items").select("stock").eq("item_id", recipe.item_id).single();
          if (inv) {
            const deductAmt = Number(recipe.amount) * qty;
            console.log(`[deductOrderStock] Deducting ${deductAmt} from fnb_inventory_items (recipe): ${recipe.item_id}`);
            const { error } = await supabase.from("fnb_inventory_items").update({ stock: Math.floor(inv.stock - deductAmt) }).eq("item_id", recipe.item_id);
            if (error) console.error("[deductOrderStock] fnb_inventory_items recipe update error:", error);
          }
        }
      } else {
        console.warn(`[deductOrderStock] No recipe found for F&B item: ${productId} with size: ${sizeLabel}`);
      }
    }
  }

  // After all deductions, recalculate max_yield for any F&B products involved
  const fnbItemIds = items.filter((i: any) => i.item_type === "fnb_single" || i.item_type === "fnb_size");
  const affectedProductIds = new Set<string>();

  for (const item of fnbItemIds) {
    if (item.item_type === "fnb_single") {
      affectedProductIds.add(item.item_id);
    } else {
      const { data: sz } = await supabase.from("product_sizes").select("product_id").eq("size_id", item.item_id).single();
      if (sz) affectedProductIds.add(sz.product_id);
    }
  }

  for (const pid of Array.from(affectedProductIds)) {
    await recalculateMaxYield(pid, tenantId);
  }

  return { error: null };
}


export async function restoreOrderStock(
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
      if (prod) {
        await supabase.from("nfb_products").update({ quantity: prod.quantity + qty }).eq("product_id", item.item_id);
      }
    } else if (item.item_type === "nfb_variant") {
      const { data: opt } = await supabase.from("nfb_variant_options").select("product_id, stock").eq("option_id", item.item_id).single();
      if (opt) {
        await supabase.from("nfb_variant_options").update({ stock: opt.stock + qty }).eq("option_id", item.item_id);
        await recalculateNfbProductQuantity(opt.product_id, tenantId);
      }
    } else if (item.item_type === "fnb_single" || item.item_type === "fnb_size") {
      let productId = item.item_id;
      let sizeLabel = item.size_label;

      if (item.item_type === "fnb_size") {
        const { data: sd } = await supabase.from("product_sizes").select("product_id, label").eq("size_id", item.item_id).single();
        if (sd) { productId = sd.product_id; sizeLabel = sd.label; }
      }

      const { data: recipes } = sizeLabel 
        ? await supabase.from("product_recipes").select("item_id, amount").eq("product_id", productId).eq("size_label", sizeLabel)
        : await supabase.from("product_recipes").select("item_id, amount").eq("product_id", productId).is("size_label", null);
      
      if (recipes) {
        for (const recipe of recipes) {
          const { data: inv } = await supabase.from("fnb_inventory_items").select("stock").eq("item_id", recipe.item_id).single();
          if (inv) {
            const addAmt = Number(recipe.amount) * qty;
            await supabase.from("fnb_inventory_items").update({ stock: Math.floor(inv.stock + addAmt) }).eq("item_id", recipe.item_id);
          }
        }
      }
      // After restoring ingredients, recalculate yield for the product
      await recalculateMaxYield(productId, tenantId);
    }
  }
  return { error: null };
}

// ─── Process & Complete Order (transaction record) ───────────

export async function processAndCompleteOrder(
  orderId: string,
  remarks: string = ""
): Promise<{ error: string | null }> {
  const supabase = createClient();

  // 1. DUPLICATE GUARD: Check if transaction already exists
  const { data: existing } = await supabase
    .from("transactions")
    .select("transaction_id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existing) {
    console.log("[processAndCompleteOrder] Transaction already exists for order:", orderId, ". Skipping duplicate save.");
    return { error: null };
  }

  const items = await fetchOrderItems(orderId);

  // Mark order as Received + Confirmed
  const updatePayload: any = { 
    fulfillment_status: "Received", 
    payment_status: "Confirmed" 
  };
  if (remarks) updatePayload.cancel_reason = remarks; // Use for resolution remarks

  const { data: orderData, error: statusError } = await supabase
    .from("orders")
    .update(updatePayload)
    .eq("order_id", orderId)
    .select("order_id, tenant_id, customer_id, total_amount, payment_method, users!orders_customer_id_fkey(first_name, last_name, display_name)")
    .single();

  if (statusError) return { error: statusError.message };

  // Insert transaction record
  if (!orderData) {
    console.error("[processAndCompleteOrder] Order data was null after update. This should not happen.");
    return { error: "Failed to retrieve order data after update." };
  }

  const u = orderData.users as any;
  const customerName = u?.first_name && u?.last_name
    ? `${u.first_name} ${u.last_name}`
    : u?.display_name ?? "Customer";

  console.log("[processAndCompleteOrder] Saving transaction for order:", orderId, "Customer:", customerName);

  const { error: txError } = await supabase.from("transactions").insert({
    order_id:       orderData.order_id,
    tenant_id:      orderData.tenant_id,
    customer_id:    orderData.customer_id,
    customer_name:  customerName,
    total_amount:   Number(orderData.total_amount),
    payment_method: orderData.payment_method,
    item_count:     items.length,
  });

  if (txError) {
    console.error("[processAndCompleteOrder] Transaction insert failed:", txError);
    return { error: `Order completed, but transaction record failed: ${txError.message} (Code: ${txError.code})` };
  }

  console.log("[processAndCompleteOrder] Transaction RECORDED successfully for order:", orderId);

  // Audit log — fire-and-forget
  getAuditContext().then((ctx: any) => {
    if (!ctx) return;
    logAuditEvent({
      tenantId:   orderData.tenant_id,
      userId:     ctx.userId,
      userName:   ctx.userName,
      action:     "COMPLETE",
      entityType: "order",
      entityId:   orderData.order_id,
      entityName: `Order #${orderData.order_id.slice(0, 8).toUpperCase()} (${customerName})`,
      details:    { total_amount: Number(orderData.total_amount), item_count: items.length },
    });
  });

  return { error: null };
}

// ─── Fetch Transactions ────────────────────────────────────────────────────────

export async function fetchTransactions(tenantId: string): Promise<Transaction[]> {
  const supabase = createClient();
  
  // Use wildcard select and remove strict ordering to avoid errors if columns are missing
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("tenant_id", tenantId);

  if (error || !data) { 
    console.error("[fetchTransactions] DB Error:", error); 
    return []; 
  }

  return data.map((t: any) => ({
    transaction_id: t.transaction_id || t.id || "Unknown",
    order_id:       t.order_id || "Unknown",
    tenant_id:      t.tenant_id,
    customer_name:  t.customer_name || "Customer",
    total_amount:   Number(t.total_amount || 0),
    payment_method: t.payment_method || "Unknown",
    item_count:     t.item_count || 0,
    completed_at:   t.completed_at || t.created_at || new Date().toISOString(),
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
  const { error } = await supabase.from("tenant_audit_logs").insert({
    tenant_id:   params.tenantId,
    user_id:     params.userId,
    user_name:   params.userName,
    action:      params.action,
    entity_type: params.entityType,
    entity_id:   params.entityId   ?? null,
    entity_name: params.entityName ?? null,
    details:     params.details    ?? null,
  });
  if (error) {
    console.error("[logAuditEvent] INSERT failed:", error.code, error.message, error.details);
  }
}

export async function logOrderView(
  orderId: string, 
  tenantId: string, 
  viewType: "PROOFS" | "DETAILS" | "PAYMENT"
): Promise<void> {
  const ctx = await getAuditContext();
  if (!ctx) return;

  await logAuditEvent({
    tenantId,
    userId:     ctx.userId,
    userName:   ctx.userName,
    action:     `VIEW_${viewType}`,
    entityType: "order",
    entityId:   orderId,
    entityName: `Order #${orderId.slice(0, 8).toUpperCase()}`,
    details:    { view_type: viewType },
  });
}

export async function fetchAuditLogs(tenantId: string): Promise<AuditLog[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tenant_audit_logs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error(
      "[fetchAuditLogs] SELECT failed — code:", error.code,
      "| message:", error.message,
      "| hint:", error.hint
    );
    return [];
  }
  if (!data || data.length === 0) { return []; }

  // Log first row so you can see the real column names in the console
  console.log("[fetchAuditLogs] sample row columns:", Object.keys(data[0]));

  // Map defensively — handles id vs log_id and any other naming variants
  return data.map((r: Record<string, unknown>) => ({
    log_id:      (r.log_id ?? r.id ?? "") as string,
    tenant_id:   (r.tenant_id ?? "") as string,
    user_id:     (r.user_id ?? "") as string,
    user_name:   (r.user_name ?? r.username ?? r.performed_by ?? "System") as string,
    action:      (r.action ?? r.event_type ?? "") as string,
    entity_type: (r.entity_type ?? r.type ?? "unknown") as string,
    entity_id:   (r.entity_id ?? null) as string | null,
    entity_name: (r.entity_name ?? null) as string | null,
    details:     (r.details ?? r.metadata ?? null) as Record<string, unknown> | null,
    created_at:  (r.created_at ?? "") as string,
  }));
}

// ─── Delivery Proof & Customer Receipt ───────────────────────────────────────

export async function uploadDeliveryProof(
  orderId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();
  const fileExt = file.name.split(".").pop();
  const fileName = `${orderId}_delivery_proof_${Date.now()}.${fileExt}`;
  const filePath = `delivery-proofs/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("store-assets")
    .upload(filePath, file);

  if (uploadError) return { url: null, error: uploadError.message };

  const { data } = supabase.storage.from("store-assets").getPublicUrl(filePath);
  const publicUrl = data.publicUrl;
  const { error: updateError } = await supabase
    .from("orders")
    .update({ delivery_proof_url: publicUrl })
    .eq("order_id", orderId);

  if (!updateError) {
    // ONLY Notify customer AFTER delivery proof is uploaded
    const { data: ord } = await supabase.from("orders").select("customer_id, tenant_id").eq("order_id", orderId).single();
    if (ord) {
      // Check for existing dispatch notification to avoid duplicates
      const { data: existing } = await supabase
        .from("customer_notifications")
        .select("id")
        .eq("order_id", orderId)
        .eq("notification_type", "ORDER_DISPATCHED")
        .limit(1)
        .maybeSingle();

      if (!existing) {
        const { error: notifError } = await supabase.from("customer_notifications").insert({
          customer_id:       ord.customer_id,
          tenant_id:         ord.tenant_id,
          order_id:          orderId,
          notification_type: "DELIVERY_IN_PROGRESS", // Use distinct type
          title:             "Delivery in Progress!",
          message:           `Your order #${orderId.slice(0, 8).toUpperCase()} is on its way! Have you received it?`,
        });
        if (notifError) {
          console.error("[uploadDeliveryProof] Notification failed:", notifError);
          return { url: publicUrl, error: `Proof uploaded, but notification failed: ${notifError.message}` };
        }
      }
    }
  }

  return { url: publicUrl, error: updateError?.message ?? null };
}

export async function uploadProofOfPayment(
  orderId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();
  const fileExt = file.name.split(".").pop();
  const fileName = `${orderId}_pop_${Date.now()}.${fileExt}`;
  const filePath = `proofs-of-payment/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("store-assets")
    .upload(filePath, file);

  if (uploadError) return { url: null, error: uploadError.message };

  const { data } = supabase.storage.from("store-assets").getPublicUrl(filePath);
  const publicUrl = data.publicUrl;

  const { error: updateError } = await supabase
    .from("orders")
    .update({ proof_of_payment_url: publicUrl })
    .eq("order_id", orderId);

  return { url: publicUrl, error: updateError?.message ?? null };
}

export async function confirmOrderReceipt(
  orderId: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("orders")
    .update({ 
      fulfillment_status: "Received",
      customer_confirmed_received: true,
      received_at: new Date().toISOString()
    })
    .eq("order_id", orderId);

  if (!error) {
    // Record the transaction!
    const { error: completionError } = await processAndCompleteOrder(orderId);
    if (completionError) return { error: completionError };
  }

  return { error: error?.message ?? null };
}

export async function reportOrderUnreceived(
  orderId: string,
  reason: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("orders")
    .update({ 
      fulfillment_status: "Reported",
      cancel_reason: reason // Reuse this column for the report reason
    })
    .eq("order_id", orderId);

  return { error: error?.message ?? null };
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

  // Ensure we use the exact strings the database enum expects
  const dbPaymentMethod = payload.payment_method === "QR Code" ? "QR Code" : "Cash-on-Delivery";

  console.log("[placeOrder] Explicit payment method for DB:", dbPaymentMethod);

  console.log(`[placeOrder] Validating aggregate stock for ${payload.items.length} items...`);
  const validation = await validateInventoryForOrder(payload.tenant_id, payload.items);
  
  if (!validation.isPossible) {
    let errorMsg = validation.error || "Insufficient stock.";
    if (validation.bottlenecks && validation.bottlenecks.length > 0) {
      // Create a clean, bulleted list for the customer
      errorMsg = validation.bottlenecks.map((b: any) => b.reason).join("\n");
    }
    return { order_id: null, error: errorMsg };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      tenant_id:          payload.tenant_id,
      customer_id:        payload.customer_id,
      payment_method:     dbPaymentMethod,
      payment_status:     "Pending",
      fulfillment_status: "Pending",
      total_amount:       payload.total_amount,
    })
    .select("order_id")
    .single();

  if (orderError || !order) {
    console.error("placeOrder insert error:", JSON.stringify(orderError, null, 2));
    
    // Fallback: Try without payment_status/fulfillment_status in case they are missing columns
    console.warn("[placeOrder] Retrying insert with base columns...");
    const { data: baseOrder, error: baseOrderError } = await supabase
      .from("orders")
      .insert({
        tenant_id:      payload.tenant_id,
        customer_id:    payload.customer_id,
        payment_method: dbPaymentMethod,
        total_amount:   payload.total_amount,
      })
      .select("order_id")
      .single();

    if (baseOrderError || !baseOrder) {
      console.error("placeOrder base insert error:", JSON.stringify(baseOrderError, null, 2));
      return { order_id: null, error: baseOrderError?.message ?? orderError?.message ?? "Failed to create order." };
    }
    return proceedWithItems(baseOrder.order_id);
  }

  return proceedWithItems(order.order_id);

  async function proceedWithItems(orderId: string) {
    // Try with extended columns
    const richItems = payload.items.map((item: any) => ({
      order_id:   orderId,
      item_id:    item.item_id,
      item_type:  item.item_type,
      item_name:  item.item_name,
      size_label: item.size_label ?? null,
      quantity:   item.quantity,
      unit_price: item.unit_price,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(richItems);
    if (!itemsError) return { order_id: orderId, error: null };

    // Fallback — base columns only
    console.warn("[placeOrder] Using base items insert:", itemsError.message);
    const baseItems = payload.items.map((item: any) => ({
      order_id:   orderId,
      item_id:    item.item_id,
      quantity:   item.quantity,
      unit_price: item.unit_price,
    }));

    const { error: baseError } = await supabase.from("order_items").insert(baseItems);
    if (baseError) {
      await supabase.from("orders").delete().eq("order_id", orderId);
      return { order_id: null, error: baseError.message };
    }

    return { order_id: orderId, error: null };
  }
}
