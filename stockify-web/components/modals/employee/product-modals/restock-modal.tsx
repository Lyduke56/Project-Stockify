"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, PackagePlus, Loader2, CheckCircle2, AlertCircle,
  ChevronRight, FlaskConical, Layers,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAuditEvent } from "@/lib/employee/order-actions";
import type { Product } from "@/lib/employee/products";
import type { NfbProduct } from "@/lib/employee/nfb-products";
import { type StorefrontConfig } from "@/lib/admin/storefront-actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IngredientRow {
  item_id: string;
  name: string;
  unit: string;       // base_unit
  stock: number;       // current stock
  addAmount: string;       // user input
}

interface VariantOptionRow {
  option_id: string;
  variant_type: string;
  label: string;
  stock: number;
  unit_of_measure: string;
  addAmount: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RestockModalProps {
  type: "fnb" | "nfnb";
  product: Product | NfbProduct;
  tenantId: string;
  onClose: () => void;
  onSuccess: () => void;
  colors?: StorefrontConfig | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RestockModal({
  type, product, tenantId, onClose, onSuccess, colors,
}: RestockModalProps) {
  const modalStyles = {
    "--color-primary": colors?.color_primary ?? "#385E31",
    "--color-secondary": colors?.color_secondary ?? "#2A4725",
    "--color-accent": colors?.color_accent ?? "#F7B71D",
    "--color-background": colors?.color_background ?? "#FFFCEB",
    "--color-text": colors?.color_text ?? "#3A6131",
    "--color-sidebar-text": colors?.color_sidebar_text ?? "#FFF9D7",
  } as React.CSSProperties;
  const supabase = createClient();

  // ── F&B state ─────────────────────────────────────────────────
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  // ── NF&B simple state ─────────────────────────────────────────
  const [simpleAdd, setSimpleAdd] = useState("");
  // ── NF&B variant state ────────────────────────────────────────
  const [variantRows, setVariantRows] = useState<VariantOptionRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  // ── Load data on mount ────────────────────────────────────────
  useEffect(() => {
    if (type === "fnb") {
      loadFnbIngredients();
    } else {
      loadNfnbStock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── F&B: fetch unique ingredients from recipes ────────────────
  async function loadFnbIngredients() {
    setLoading(true);
    const { data: recipes } = await supabase
      .from("product_recipes")
      .select("item_id, item_type")
      .eq("product_id", product.product_id)
      .eq("tenant_id", tenantId);

    if (!recipes || recipes.length === 0) {
      setIngredients([]);
      setLoading(false);
      return;
    }

    // Deduplicate ingredient IDs
    const itemIds = [...new Set(recipes.map((r: any) => r.item_id))];

    const { data: items } = await supabase
      .from("fnb_inventory_items")
      .select("item_id, name, base_unit, stock")
      .in("item_id", itemIds);

    setIngredients(
      (items ?? []).map((i: any) => ({
        item_id: i.item_id,
        name: i.name,
        unit: i.base_unit,
        stock: Number(i.stock) || 0,
        addAmount: "",
      }))
    );
    setLoading(false);
  }

  // ── NF&B: load variant options or simple qty ──────────────────
  async function loadNfnbStock() {
    setLoading(true);
    const nfb = product as NfbProduct;
    const hasVariants = nfb.variants && nfb.variants.length > 0;

    if (!hasVariants) {
      setLoading(false);
      return;
    }

    // Fetch live stock from DB for all options
    const optionIds = nfb.variants!.flatMap((v: any) =>
      (v.options ?? []).map((o: any) => o.option_id)
    );

    const { data: opts } = await supabase
      .from("nfb_variant_options")
      .select("option_id, label, stock, variant_type_id")
      .in("option_id", optionIds);

    const rows: VariantOptionRow[] = [];
    for (const vt of nfb.variants!) {
      for (const opt of vt.options ?? []) {
        const live = opts?.find((o: any) => o.option_id === opt.option_id);
        rows.push({
          option_id: opt.option_id,
          variant_type: vt.name,
          label: opt.label,
          stock: live ? Number(live.stock) : Number(opt.stock) || 0,
          unit_of_measure: (nfb as any).unit_of_measure ?? "pcs",
          addAmount: "",
        });
      }
    }
    setVariantRows(rows);
    setLoading(false);
  }

  // ── Save ──────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setFeedback(null);

    // Fetch current user for audit log
    const { data: { user } } = await supabase.auth.getUser();
    const auditUserId = user?.id ?? "";
    let auditUserName = "Unknown";
    if (user) {
      const { data: u } = await supabase
        .from("users")
        .select("first_name, last_name, display_name")
        .eq("user_id", user.id)
        .single();
      auditUserName = u?.first_name && u?.last_name
        ? `${u.first_name} ${u.last_name}` : u?.display_name ?? user.email ?? "Unknown";
    }

    try {
      if (type === "fnb") {
        // Update each ingredient's stock
        const toUpdate = ingredients.filter((i) => {
          const n = Number(i.addAmount);
          return !isNaN(n) && n > 0;
        });
        if (toUpdate.length === 0) {
          setFeedback({ ok: false, msg: "Enter at least one amount to restock." });
          setSaving(false);
          return;
        }
        for (const ing of toUpdate) {
          const newStock = ing.stock + Number(ing.addAmount);
          const { error } = await supabase
            .from("fnb_inventory_items")
            .update({ stock: newStock })
            .eq("item_id", ing.item_id);
          if (error) throw error;
        }

        // Audit log — one entry per restocked ingredient
        for (const ing of toUpdate) {
          logAuditEvent({
            tenantId,
            userId: auditUserId,
            userName: auditUserName,
            action: "RESTOCK",
            entityType: "ingredient",
            entityId: ing.item_id,
            entityName: `${ing.name} (via ${product.name})`,
            details: { added: Number(ing.addAmount), new_stock: ing.stock + Number(ing.addAmount), unit: ing.unit },
          });
        }

      } else {
        const nfb = product as NfbProduct;
        const hasVariants = nfb.variants && nfb.variants.length > 0;

        if (!hasVariants) {
          // Simple product — add to nfb_products.quantity
          const n = Number(simpleAdd);
          if (isNaN(n) || n <= 0) {
            setFeedback({ ok: false, msg: "Enter a valid quantity to add." });
            setSaving(false);
            return;
          }
          const newQty = Number(nfb.quantity) + n;
          const { error } = await supabase
            .from("nfb_products")
            .update({ quantity: newQty })
            .eq("product_id", product.product_id);
          if (error) throw error;

          // Audit log
          logAuditEvent({
            tenantId,
            userId: auditUserId,
            userName: auditUserName,
            action: "RESTOCK",
            entityType: "product",
            entityId: product.product_id,
            entityName: product.name,
            details: { added: n, new_qty: newQty, unit: nfb.unit_of_measure },
          });

        } else {
          // Variant product — update each option's stock
          const toUpdate = variantRows.filter((r) => {
            const n = Number(r.addAmount);
            return !isNaN(n) && n > 0;
          });
          if (toUpdate.length === 0) {
            setFeedback({ ok: false, msg: "Enter at least one amount to restock." });
            setSaving(false);
            return;
          }
          for (const row of toUpdate) {
            const newStock = row.stock + Number(row.addAmount);
            const { error } = await supabase
              .from("nfb_variant_options")
              .update({ stock: newStock })
              .eq("option_id", row.option_id);
            if (error) throw error;
          }

          // Audit log — one entry per restocked variant
          for (const row of toUpdate) {
            logAuditEvent({
              tenantId,
              userId: auditUserId,
              userName: auditUserName,
              action: "RESTOCK",
              entityType: "variant",
              entityId: row.option_id,
              entityName: `${product.name} — ${row.variant_type}: ${row.label}`,
              details: { added: Number(row.addAmount), new_stock: row.stock + Number(row.addAmount), unit: row.unit_of_measure },
            });
          }
        }
      }

      setFeedback({ ok: true, msg: "Restocked successfully!" });
      setTimeout(() => { onSuccess(); onClose(); }, 1200);

    } catch (e: any) {
      setFeedback({ ok: false, msg: e.message ?? "Failed to restock." });
    } finally {
      setSaving(false);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────
  const isFnb = type === "fnb";
  const nfbProduct = product as NfbProduct;
  const hasVariants = !isFnb && nfbProduct.variants && nfbProduct.variants.length > 0;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="restock-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        key="restock-modal"
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
      >
        <div style={modalStyles} className="bg-background rounded-[24px] w-full max-w-[520px] shadow-2xl pointer-events-auto overflow-hidden max-h-[90dvh] flex flex-col">

          {/* Header */}
          <div className="bg-primary px-6 py-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <PackagePlus size={18} className="text-accent" />
              </div>
              <div>
                <h2 className="text-[var(--color-sidebar-text,#FFF9D7)] font-black text-[16px]">Restock</h2>
                <p className="text-[var(--color-sidebar-text,#FFF9D7)]/60 text-[11px] font-medium truncate max-w-[280px]">
                  {product.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

            {loading ? (
              <div className="flex items-center justify-center py-12 text-primary/40 gap-3">
                <Loader2 size={22} className="animate-spin" />
                <span className="text-[13px] font-semibold">Loading stock data…</span>
              </div>

            ) : isFnb ? (
              /* ── F&B: Ingredient Restock ────────────────────────── */
              <>
                <div className="flex items-center gap-2 mb-1">
                  <FlaskConical size={14} className="text-primary/60" />
                  <p className="text-[11px] font-black uppercase tracking-wider text-primary/60">
                    Restock Ingredients
                  </p>
                </div>

                {ingredients.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                    <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-amber-700 text-[13px] font-medium">
                      This product has no recipe ingredients configured. Add ingredients via the Edit Product modal first.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {ingredients.map((ing: any, idx) => (
                      <div
                        key={ing.item_id}
                        className="bg-background border border-primary/10 rounded-2xl px-4 py-3 flex items-center gap-4 shadow-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-primary font-bold text-[13px] truncate">{ing.name}</p>
                          <p className="text-primary/50 text-[11px] font-medium mt-0.5">
                            Current stock: <span className="font-black">{ing.stock}</span> {ing.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-primary/40 text-[11px] font-bold">+</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0"
                            value={ing.addAmount}
                            onChange={(e) =>
                              setIngredients((prev: any) =>
                                prev.map((r: any, i: number) => i === idx ? { ...r, addAmount: e.target.value } : r)
                              )
                            }
                            className="w-[80px] border border-primary/20 focus:border-primary rounded-xl px-3 py-2 text-[13px] text-primary font-bold text-center outline-none transition-colors bg-background"
                          />
                          <span className="text-primary/50 text-[11px] font-medium w-[30px]">{ing.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>

            ) : !hasVariants ? (
              /* ── NF&B Simple: single qty input ─────────────────── */
              <>
                <div className="flex items-center gap-2 mb-1">
                  <PackagePlus size={14} className="text-primary/60" />
                  <p className="text-[11px] font-black uppercase tracking-wider text-primary/60">
                    Add Stock
                  </p>
                </div>
                <div className="bg-background border border-primary/10 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
                  <div className="flex-1">
                    <p className="text-primary font-bold text-[13px]">{product.name}</p>
                    <p className="text-primary/50 text-[11px] font-medium mt-0.5">
                      Current qty: <span className="font-black">{nfbProduct.quantity}</span>{" "}
                      {nfbProduct.unit_of_measure}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary/40 text-[13px] font-black">+</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={simpleAdd}
                      onChange={(e) => setSimpleAdd(e.target.value)}
                      className="w-[90px] border border-primary/20 focus:border-primary rounded-xl px-3 py-2.5 text-[14px] text-primary font-black text-center outline-none transition-colors bg-background"
                    />
                    <span className="text-primary/50 text-[11px] font-medium">
                      {nfbProduct.unit_of_measure}
                    </span>
                  </div>
                </div>
              </>

            ) : (
              /* ── NF&B Variants: per-option stock inputs ─────────── */
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Layers size={14} className="text-primary/60" />
                  <p className="text-[11px] font-black uppercase tracking-wider text-primary/60">
                    Restock Variants
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {variantRows.map((row: any, idx) => (
                    <div
                      key={row.option_id}
                      className="bg-background border border-primary/10 rounded-2xl px-4 py-3 flex items-center gap-4 shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-primary/40 uppercase tracking-wider">{row.variant_type}</span>
                          <ChevronRight size={10} className="text-primary/30" />
                          <span className="text-primary font-bold text-[13px]">{row.label}</span>
                        </div>
                        <p className="text-primary/50 text-[11px] font-medium mt-0.5">
                          Current stock: <span className="font-black">{row.stock}</span>{" "}
                          {row.unit_of_measure}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-primary/40 text-[11px] font-bold">+</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={row.addAmount}
                          onChange={(e) =>
                            setVariantRows((prev: any) =>
                              prev.map((r: any, i: number) => i === idx ? { ...r, addAmount: e.target.value } : r)
                            )
                          }
                          className="w-[80px] border border-primary/20 focus:border-primary rounded-xl px-3 py-2 text-[13px] text-primary font-bold text-center outline-none transition-colors bg-background"
                        />
                        <span className="text-primary/50 text-[11px] font-medium w-[30px]">
                          {row.unit_of_measure}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Feedback */}
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-medium ${feedback.ok
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-600"
                  }`}
              >
                {feedback.ok
                  ? <CheckCircle2 size={15} />
                  : <AlertCircle size={15} />}
                {feedback.msg}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-4 border-t border-primary/10 flex gap-3 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-primary/20 text-primary/60 font-bold text-[13px] hover:bg-primary/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading || (isFnb && ingredients.length === 0)}
              className="flex-1 bg-primary text-[var(--color-sidebar-text,#FFF9D7)] py-3 rounded-2xl font-black text-[13px] hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
            >
              {saving
                ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
                : <><PackagePlus size={15} /> Confirm Restock</>
              }
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
