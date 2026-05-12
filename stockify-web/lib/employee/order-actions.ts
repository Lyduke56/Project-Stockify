"use client";

import { createClient } from "@/lib/supabase/client";

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

export type FulfillmentStatus = "Pending" | "Processing" | "Dispatched" | "Received" | "Cancelled";
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

  // Fetch current order state
  const { data: ord, error: fetchErr } = await supabase
    .from("orders")
    .select("tenant_id, customer_id, fulfillment_status, users!orders_customer_id_fkey(display_name, first_name, last_name)")
    .eq("order_id", orderId)
    .single();

  if (fetchErr || !ord) return { error: fetchErr?.message ?? "Order not found." };

  // 1. If moving to "Dispatched" from "Pending" or "Processing", deduct stock
  // This ensures stock is deducted only once when it leaves the store.
  if (status === "Dispatched" && (ord.fulfillment_status === "Pending" || ord.fulfillment_status === "Processing")) {
    const { error: deductErr } = await deductOrderStock(orderId, ord.tenant_id);
    if (deductErr) return { error: deductErr };
  }

  const { error } = await supabase
    .from("orders")
    .update({ fulfillment_status: status })
    .eq("order_id", orderId);

  // Send notification to customer
  if (!error) {
    supabase.from("customer_notifications").insert({
      customer_id: ord.customer_id,
      tenant_id:   ord.tenant_id,
      title:       `Order Update: ${status}`,
      message:     `Your order #${orderId.slice(0, 8).toUpperCase()} is now ${status.toLowerCase()}.`,
    }).then(); // Fire-and-forget
  }

  // Fire-and-forget audit log
  if (!error) {
    getAuditContext().then((ctx) => {
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
    .select("tenant_id, customer_id, fulfillment_status, users!orders_customer_id_fkey(display_name, first_name, last_name)")
    .eq("order_id", orderId)
    .single();

  if (fetchErr || !ord) return { error: fetchErr?.message ?? "Order not found." };

  // If cancelling an order that was already Dispatched or Received, restore stock
  if (ord.fulfillment_status === "Dispatched" || ord.fulfillment_status === "Received") {
    console.log(`[cancelOrder] Restoring stock for ${ord.fulfillment_status} order:`, orderId);
    await restoreOrderStock(orderId, ord.tenant_id);
  }

  const { error } = await supabase
    .from("orders")
    .update({ fulfillment_status: "Cancelled", cancel_reason: reason?.trim() || null })
    .eq("order_id", orderId);

  if (!error && ord) {
    // Notify customer about cancellation
    supabase.from("customer_notifications").insert({
      customer_id: ord.customer_id,
      tenant_id:   ord.tenant_id,
      title:       "Order Cancelled",
      message:     `Your order #${orderId.slice(0, 8).toUpperCase()} has been cancelled. ${reason ? `Reason: ${reason}` : ""}`,
    }).then();

    getAuditContext().then((ctx) => {
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
        details:    { reason: reason?.trim() || null },
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

    // Guess type if unknown
    if (type === "unknown") {
      const { data: nfbP } = await supabase.from("nfb_products").select("product_id").eq("product_id", item.item_id).single();
      if (nfbP) type = "nfb_single";
      else {
        const { data: opt } = await supabase.from("nfb_variant_options").select("option_id").eq("option_id", item.item_id).single();
        if (opt) type = "nfb_variant";
        else {
          const { data: fnbR } = await supabase.from("product_recipes").select("product_id").eq("product_id", item.item_id).limit(1).single();
          if (fnbR) type = "fnb_single";
          else {
            const { data: fnbI } = await supabase.from("fnb_inventory_items").select("item_id").eq("item_id", item.item_id).single();
            if (fnbI) type = "fnb_inventory";
          }
        }
      }
    }

    if (type === "nfb_single") {
      const { data: prod } = await supabase.from("nfb_products").select("name, quantity").eq("product_id", item.item_id).single();
      if (!prod || prod.quantity < qty) return { error: `Insufficient stock for ${prod?.name || "Product"}` };
    } else if (type === "nfb_variant") {
      const { data: opt } = await supabase.from("nfb_variant_options").select("label, stock").eq("option_id", item.item_id).single();
      if (!opt || opt.stock < qty) return { error: `Insufficient stock for variant ${opt?.label || "Variant"}` };
    } else if (type === "fnb_inventory") {
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

    // RESILIENCE: If type is unknown, try to guess it by checking all possible tables
    if (type === "unknown") {
      console.warn(`[deductOrderStock] Item type unknown for ${item.item_id}. Guessing...`);
      
      // 1. Check NF&B Products
      const { data: nfbP } = await supabase.from("nfb_products").select("product_id").eq("product_id", item.item_id).single();
      if (nfbP) { type = "nfb_single"; }
      else {
        // 2. Check NF&B Variants
        const { data: opt } = await supabase.from("nfb_variant_options").select("option_id").eq("option_id", item.item_id).single();
        if (opt) { type = "nfb_variant"; }
        else {
          // 3. Check F&B Recipes
          const { data: fnbR } = await supabase.from("product_recipes").select("product_id").eq("product_id", item.item_id).limit(1).single();
          if (fnbR) { type = "fnb_single"; }
          else {
            // 4. Check F&B Inventory Items directly
            const { data: fnbI } = await supabase.from("fnb_inventory_items").select("item_id").eq("item_id", item.item_id).single();
            if (fnbI) { type = "fnb_inventory"; }
            else {
              // 5. Check generic products table
              const { data: genP } = await supabase.from("products").select("product_id").eq("product_id", item.item_id).single();
              if (genP) { type = "fnb_single"; }
            }
          }
        }
      }
      console.log(`[deductOrderStock] Guessed type for ${item.item_id}: ${type}`);
    }

    if (type === "unknown") {
      console.error(`[deductOrderStock] Could not identify item: ${item.item_id}`);
      continue;
    }

    // --- DEDUCTION LOGIC ---
    if (type === "nfb_single") {
      const { data: prod } = await supabase.from("nfb_products").select("quantity").eq("product_id", item.item_id).single();
      if (prod) {
        console.log(`[deductOrderStock] Deducting ${qty} from nfb_products: ${item.item_id}`);
        const { error } = await supabase.from("nfb_products").update({ quantity: prod.quantity - qty }).eq("product_id", item.item_id);
        if (error) console.error("[deductOrderStock] nfb_products update error:", error);
      }
    } else if (type === "fnb_inventory") {
      const { data: inv } = await supabase.from("fnb_inventory_items").select("stock").eq("item_id", item.item_id).single();
      if (inv) {
        console.log(`[deductOrderStock] Deducting ${qty} from fnb_inventory_items (direct): ${item.item_id}`);
        const { error } = await supabase.from("fnb_inventory_items").update({ stock: inv.stock - qty }).eq("item_id", item.item_id);
        if (error) console.error("[deductOrderStock] fnb_inventory_items direct update error:", error);
      }
    } else if (type === "nfb_variant") {
      const { data: opt, error: fetchErr } = await supabase.from("nfb_variant_options").select("stock").eq("option_id", item.item_id).single();
      if (opt) {
        console.log(`[deductOrderStock] Deducting ${qty} from nfb_variant_options: ${item.item_id} (Current: ${opt.stock})`);
        const { error: updErr } = await supabase.from("nfb_variant_options").update({ stock: opt.stock - qty }).eq("option_id", item.item_id);
        if (updErr) console.error(`[deductOrderStock] Update FAILED for nfb_variant_options:`, updErr);
        else console.log(`[deductOrderStock] Update SUCCESS for nfb_variant_options`);
      } else {
        console.error(`[deductOrderStock] Could not find nfb_variant: ${item.item_id}`, fetchErr);
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
  const fnbProductIds = Array.from(new Set(
    items.filter(i => i.item_type === "fnb_single" || i.item_type === "fnb_size" || i.item_type === "unknown")
         .map(i => i.item_id)
  ));

  for (const pid of fnbProductIds) {
    await recalculateMaxYield(pid, tenantId);
  }

  return { error: null };
}

import { recalculateMaxYield } from "@/lib/shared/inventory-utils";

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
      const { data: opt } = await supabase.from("nfb_variant_options").select("stock").eq("option_id", item.item_id).single();
      if (opt) {
        await supabase.from("nfb_variant_options").update({ stock: opt.stock + qty }).eq("option_id", item.item_id);
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
  tenantId: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const items = await fetchOrderItems(orderId);
  if (items.length === 0) return { error: "No items found for this order." };

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

    // Audit log — fire-and-forget
    getAuditContext().then((ctx) => {
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

  console.log(`[placeOrder] Validating stock for ${payload.items.length} items...`);
  for (const item of payload.items) {
    if (item.item_type === "nfb_single") {
      const { data: nfb } = await supabase.from("nfb_products").select("name, quantity").eq("product_id", item.item_id).single();
      if (!nfb || nfb.quantity < item.quantity) {
        return { order_id: null, error: `Sorry, ${nfb?.name || "item"} is out of stock or insufficient.` };
      }
    } else if (item.item_type === "nfb_variant") {
      const { data: opt } = await supabase.from("nfb_variant_options").select("label, stock").eq("option_id", item.item_id).single();
      if (!opt || opt.stock < item.quantity) {
        return { order_id: null, error: `Sorry, ${opt?.label || "variant"} is out of stock.` };
      }
    } else if (item.item_type === "fnb_single" || item.item_type === "fnb_size") {
      let productId = item.item_id;
      let sizeLabel = item.size_label;

      if (item.item_type === "fnb_size") {
        const { data: sz } = await supabase.from("product_sizes").select("product_id, label").eq("size_id", item.item_id).single();
        if (sz) { productId = sz.product_id; sizeLabel = sz.label; }
      }

      // Check ingredients directly for real-time accuracy
      const { data: recipes } = sizeLabel 
        ? await supabase.from("product_recipes").select("item_id, amount").eq("product_id", productId).eq("size_label", sizeLabel)
        : await supabase.from("product_recipes").select("item_id, amount").eq("product_id", productId).is("size_label", null);

      if (recipes && recipes.length > 0) {
        for (const r of recipes) {
          const { data: inv } = await supabase.from("fnb_inventory_items").select("name, stock").eq("item_id", r.item_id).single();
          const needed = Number(r.amount) * item.quantity;
          if (!inv || inv.stock < needed) {
            return { order_id: null, error: `Sorry, we are out of ingredients for ${item.item_name}.` };
          }
        }
      } else {
        // Fallback to max_yield if no recipe is found (e.g. direct sale items)
        const { data: fnb } = await supabase.from("products").select("name, max_yield").eq("product_id", productId).single();
        if (!fnb || fnb.max_yield < item.quantity) {
          return { order_id: null, error: `Sorry, ${item.item_name} is out of stock.` };
        }
      }
    }
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
    const richItems = payload.items.map((item) => ({
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
    const baseItems = payload.items.map((item) => ({
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
