import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOrderCancellationEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const { orderId, reason } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required." }, { status: 400 });
    }

    // Initialize inside handler — safe for serverless/edge
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ── 1. Fetch order ────────────────────────────────────────────────────────
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("order_id, customer_id, tenant_id, total_amount, payment_method, created_at")
      .eq("order_id", orderId)
      .single();

    if (orderErr || !order) {
      console.error("[cancel] order fetch error:", orderErr);
      return NextResponse.json(
        { error: orderErr?.message ?? "Order not found." },
        { status: 404 }
      );
    }

    // ── 1b. Fetch customer info separately ────────────────────────────────────
    const { data: userRow } = await supabase
      .from("users")
      .select("first_name, last_name, display_name, email")
      .eq("user_id", order.customer_id)
      .single();

    // ── 2. Fetch order items for the email ────────────────────────────────────
    const { data: items } = await supabase
      .from("order_items")
      .select("item_name, quantity, unit_price")
      .eq("order_id", orderId);

    // ── 3. Cancel order — try with cancel_reason, fall back without ───────────
    const withReason = await supabase
      .from("orders")
      .update({ fulfillment_status: "Cancelled", cancel_reason: reason?.trim() || null })
      .eq("order_id", orderId);

    if (withReason.error) {
      console.warn("[cancel] cancel_reason update failed, retrying without it:", withReason.error.message);
      // column may not exist yet — try without cancel_reason
      const withoutReason = await supabase
        .from("orders")
        .update({ fulfillment_status: "Cancelled" })
        .eq("order_id", orderId);

      if (withoutReason.error) {
        console.error("[cancel] status update failed:", withoutReason.error);
        return NextResponse.json({ error: withoutReason.error.message }, { status: 500 });
      }
    }

    // ── 3.5 Create Customer Notification ──────────────────────────────────────
    const notificationTitle = "Order Cancelled";
    const notificationMessage = reason?.trim() ? `Order #${orderId.slice(0, 8).toUpperCase()} was cancelled. Reason: ${reason.trim()}` : `Order #${orderId.slice(0, 8).toUpperCase()} was cancelled.`;
    
    const { error: notifError } = await supabase.from('customer_notifications').insert({
      customer_id: order.customer_id,
      tenant_id: order.tenant_id,
      title: notificationTitle,
      message: notificationMessage,
      notification_type: 'ORDER_CANCELLED',
      order_id: orderId,
      is_read: false
    });

    if (notifError) {
      console.error("[cancel] Failed to insert notification:", notifError);
    }
    // ── 4. Send cancellation email ────────────────────────────────────────────
    const customerName =
      userRow?.first_name && userRow?.last_name
        ? `${userRow.first_name} ${userRow.last_name}`
        : userRow?.display_name ?? "Customer";
    const customerEmail: string | null = userRow?.email ?? null;

    const orderDate = new Date(order.created_at).toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    if (customerEmail) {
      try {
        await sendOrderCancellationEmail({
          to: customerEmail,
          customerName,
          orderId: order.order_id,
          orderDate,
          totalAmount: Number(order.total_amount),
          paymentMethod: order.payment_method,
          cancelReason: reason?.trim() || "No reason provided.",
          items: (items ?? []).map((i: any) => ({
            name: i.item_name ?? "Item",
            qty: i.quantity,
            unitPrice: Number(i.unit_price),
          })),
        });
      } catch (emailErr) {
        console.error("[cancel] Email failed:", emailErr);
        // Don't fail the whole request if email fails
      }
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("[/api/orders/cancel] Unhandled error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal server error." },
      { status: 500 }
    );
  }
}
