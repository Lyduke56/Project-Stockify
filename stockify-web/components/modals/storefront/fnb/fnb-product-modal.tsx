"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Coffee, ShoppingBag, Star, Trash2, Edit2, Check, MessageSquare } from "lucide-react";
import { FnbProduct, FnbProductSize } from "@/backend/hooks/getStoreFront";
import { fetchReviews, submitReview, deleteReview, updateReview } from "@/lib/customer/customer-actions";
import { createClient } from "@/lib/supabase/client";

// ── Types ────────────────────────────────────────────────────────────────────
interface FnbProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: FnbProduct | null;
  tenantId: string;
}

interface Review {
  review_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  users?: { display_name?: string };
}

// ── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  primary:    "#2E5128",
  secondary:  "#1C3319",
  surface:    "#243D20",
  accent:     "#D4A017",
  accentSoft: "#F0C84A",
  bg:         "#F7F3E3",
  bgDim:      "rgba(247, 243, 227, 0.75)",
  muted:      "rgba(247, 243, 227, 0.45)",
  border:     "rgba(212, 160, 23, 0.2)",
  borderHi:   "rgba(212, 160, 23, 0.55)",
  shadow:     "rgba(10, 18, 9, 0.55)",
};

// ── Noise SVG (subtle grain texture) ─────────────────────────────────────────
const NoiseBg = () => (
  <svg
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.04, mixBlendMode: "overlay" }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#noise)" />
  </svg>
);

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ rating, size = 14, interactive = false, onChange }: {
  rating: number; size?: number; interactive?: boolean; onChange?: (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const effective = interactive && hovered ? hovered : rating;
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" disabled={!interactive}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => interactive && setHovered(s)}
          onMouseLeave={() => interactive && setHovered(0)}
          style={{
            background: "none", border: "none", padding: 0,
            cursor: interactive ? "pointer" : "default",
            transition: "transform .15s cubic-bezier(0.34,1.56,0.64,1)",
            transform: interactive && hovered >= s ? "scale(1.3)" : "scale(1)",
            display: "flex",
          }}
        >
          <Star size={size}
            fill={s <= effective ? T.accent : "none"}
            stroke={s <= effective ? T.accent : T.muted}
            strokeWidth={s <= effective ? 1 : 1.5}
          />
        </button>
      ))}
    </div>
  );
}

// ── Reviews ───────────────────────────────────────────────────────────────────
function InlineReviews({ productId, tenantId }: { productId: string; tenantId: string }) {
  const [reviews, setReviews]       = useState<Review[]>([]);
  const [userId, setUserId]         = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [rating, setRating]         = useState(5);
  const [comment, setComment]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);

  const load = async () => {
    const { data } = await fetchReviews(productId, "fnb");
    setReviews((data as Review[]) ?? []);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await createClient().auth.getUser();
      setUserId(user?.id ?? null);
      await load();
      setLoading(false);
    })();
  }, [productId]);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const userHasReviewed = reviews.some((r) => r.user_id === userId);
  const maxCount = Math.max(1, ...[1,2,3,4,5].map(s => reviews.filter(r => r.rating === s).length));

  const handleSubmit = async () => {
    if (!userId) return;
    setSubmitting(true);
    const { error } = await submitReview({ tenantId, productId, productType: "fnb", rating, comment });
    setSubmitting(false);
    if (!error) { setComment(""); setRating(5); load(); } else alert(error);
  };

  const handleUpdate = async (id: string) => {
    setSubmitting(true);
    const { error } = await updateReview(id, rating, comment);
    setSubmitting(false);
    if (!error) { setEditingId(null); setComment(""); setRating(5); load(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    const { error } = await deleteReview(id);
    if (!error) load();
  };

  if (loading) return (
    <div style={{ padding: "32px 0", textAlign: "center" }}>
      <div style={{ display: "inline-flex", gap: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: "50%", background: T.accent,
            animation: "pulse 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:.2;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
    </div>
  );

  return (
    <div>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".14em", color: T.accent, marginBottom: 6 }}>
            Customer Reviews
          </p>
          {reviews.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Stars rating={Math.round(avg)} size={15} />
              <span style={{ fontSize: 20, fontWeight: 900, color: T.bg, lineHeight: 1 }}>{avg.toFixed(1)}</span>
              <span style={{ fontSize: 12, color: T.muted }}>/ {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>

        {/* Mini bar chart */}
        {reviews.length > 0 && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5 }}>
            {[1,2,3,4,5].map((s) => {
              const cnt = reviews.filter(r => r.rating === s).length;
              const h = Math.round((cnt / maxCount) * 32);
              return (
                <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{ width: 7, height: 32, background: T.surface, borderRadius: 99, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                    <div style={{ width: "100%", height: h, background: cnt ? T.accent : "transparent", borderRadius: 99, transition: "height .5s ease-out" }} />
                  </div>
                  <span style={{ fontSize: 8, fontWeight: 700, color: T.muted }}>{s}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: `linear-gradient(90deg, ${T.borderHi} 0%, transparent 100%)`, marginBottom: 24 }} />

      {/* Write / Edit form */}
      {userId && (!userHasReviewed || editingId) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: T.surface, borderRadius: 18, padding: "22px",
            marginBottom: 28, border: `1px solid ${T.border}`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)"
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em", color: T.accent, marginBottom: 14 }}>
            {editingId ? "Edit your review" : "Share your thoughts"}
          </p>
          <Stars rating={rating} size={26} interactive onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you think?"
            rows={3}
            style={{
              width: "100%", marginTop: 16, padding: "14px 16px",
              background: T.secondary,
              border: `1px solid ${T.border}`,
              borderRadius: 12, fontSize: 13.5, color: T.bg, lineHeight: 1.6,
              resize: "none", outline: "none", fontFamily: "inherit",
              transition: "border-color .2s, box-shadow .2s",
              boxSizing: "border-box",
            }}
            onFocus={(e) => { e.target.style.borderColor = T.accentSoft; e.target.style.boxShadow = `0 0 0 3px ${T.accent}20`; }}
            onBlur={(e) => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
            {editingId && (
              <button onClick={() => { setEditingId(null); setComment(""); setRating(5); }} style={{
                padding: "9px 20px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                background: "transparent", color: T.muted, border: `1px solid ${T.border}`, cursor: "pointer",
              }}>Cancel</button>
            )}
            <button
              onClick={() => editingId ? handleUpdate(editingId) : handleSubmit()}
              disabled={submitting || rating === 0}
              style={{
                padding: "9px 24px", borderRadius: 10, fontSize: 12, fontWeight: 900,
                background: T.accent, color: T.secondary, border: "none", cursor: "pointer",
                opacity: submitting || rating === 0 ? .45 : 1,
                display: "flex", alignItems: "center", gap: 6,
                letterSpacing: "0.04em", textTransform: "uppercase",
                boxShadow: `0 4px 14px ${T.accent}50`,
                transition: "opacity .2s, transform .1s",
              }}
            >
              {submitting ? "Posting…" : editingId ? <><Check size={13} /> Update</> : "Post Review"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "40px 24px",
          background: T.surface, borderRadius: 18,
          border: `1px dashed ${T.border}`,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: `${T.accent}18`, display: "flex",
            alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            <MessageSquare size={22} style={{ color: T.accent }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 800, color: T.bg }}>No reviews yet</p>
          <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>Be the first to share your experience</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reviews.map((r, i) => (
            <motion.div
              key={r.review_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                display: "flex", gap: 14, padding: "18px 20px",
                background: T.surface, borderRadius: 16,
                border: `1px solid ${T.border}`,
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                background: `linear-gradient(135deg, ${T.accent} 0%, #A0730A 100%)`,
                color: T.secondary, display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 900, fontSize: 14,
                boxShadow: `0 2px 8px ${T.accent}40`,
              }}>
                {r.users?.display_name?.[0]?.toUpperCase() ?? "U"}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 800, color: T.bg }}>
                      {r.users?.display_name ?? "Anonymous"}
                    </p>
                    <Stars rating={r.rating} size={11} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: T.muted }}>
                      {new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                    {userId === r.user_id && !editingId && (
                      <>
                        <button onClick={() => { setEditingId(r.review_id); setRating(r.rating); setComment(r.comment); }} style={{
                          width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.border}`,
                          background: T.secondary, color: T.accent,
                          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                        }}><Edit2 size={11} /></button>
                        <button onClick={() => handleDelete(r.review_id)} style={{
                          width: 28, height: 28, borderRadius: 7, border: "none",
                          background: "rgba(127,29,29,0.5)", color: "#fca5a5",
                          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                        }}><Trash2 size={11} /></button>
                      </>
                    )}
                  </div>
                </div>
                {r.comment ? (
                  <p style={{ fontSize: 13, color: T.bgDim, lineHeight: 1.65 }}>{r.comment}</p>
                ) : (
                  <p style={{ fontSize: 12, color: T.muted, fontStyle: "italic" }}>No comment left.</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export const FnbProductModal = ({ isOpen, onClose, product, tenantId }: FnbProductModalProps) => {
  const [selectedSize, setSelectedSize] = useState<FnbProductSize | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes.find((s) => s.is_default) ?? product.sizes[0] ?? null);
      setQuantity(1);
      setImgLoaded(false);
    }
  }, [product]);

  if (!product) return null;

  const hasSizes     = product.sizes.length > 0;
  const currentPrice = hasSizes && selectedSize ? selectedSize.price     : product.price;
  const currentYield = hasSizes && selectedSize ? selectedSize.max_yield : product.max_yield;
  const totalPrice   = currentPrice * quantity;
  const inStock      = currentYield > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          className="md:items-center md:p-6 p-0"
        >
          {/* Subtle Scrollbar Styles */}
          <style>{`
            .subtle-scroll::-webkit-scrollbar {
              width: 6px;
            }
            .subtle-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .subtle-scroll::-webkit-scrollbar-thumb {
              background: ${T.borderHi};
              border-radius: 8px;
            }
            .subtle-scroll::-webkit-scrollbar-thumb:hover {
              background: ${T.accent};
            }
            .subtle-scroll {
              scrollbar-width: thin;
              scrollbar-color: ${T.borderHi} transparent;
            }
          `}</style>

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "absolute", inset: 0, background: "rgba(5,10,4,0.8)", backdropFilter: "blur(12px)" }}
          />

          {/* Card - Added subtle-scroll class */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="relative w-full md:max-w-[960px] max-h-[94vh] overflow-y-auto overflow-x-hidden subtle-scroll
                       rounded-t-[28px] md:rounded-[28px] flex flex-col"
            style={{
              backgroundColor: T.secondary,
              boxShadow: `0 32px 80px ${T.shadow}, 0 0 0 1px ${T.borderHi}`,
            }}
          >
            <NoiseBg />

            {/* Mobile handle */}
            <div className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 z-50">
              <div style={{ width: 36, height: 3.5, borderRadius: 99, background: T.muted }} />
            </div>

            {/* Close */}
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
              onClick={onClose}
              style={{
                position: "absolute", top: 18, right: 18, zIndex: 50,
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
                border: `1px solid ${T.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: T.bgDim,
              }}
            >
              <X size={16} strokeWidth={2.5} />
            </motion.button>

            {/* ── TOP SECTION: Image + Details (Split on Desktop) ──────────────── */}
            <div className="flex flex-col md:flex-row w-full">
              {/* ── LEFT: Image Panel ─────────────────────────────────────────── */}
              <div
                className="w-full md:w-[42%]"
                style={{
                  flexShrink: 0,
                  padding: "28px 24px 28px 28px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  background: T.secondary,
                }}
              >
                {/* Image box - Stretch to fill container */}
                <div style={{
                  position: "relative",
                  width: "100%",
                  flex: 1,
                  minHeight: "300px",
                  borderRadius: 20,
                  overflow: "hidden",
                  background: T.surface,
                  boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${T.border}`,
                }}>
                  {product.image_url ? (
                    /* Main image — stretched to fill with objectFit: cover */
                    <motion.img
                      src={product.image_url.split("?")[0]}
                      alt={product.name}
                      onLoad={() => setImgLoaded(true)}
                      initial={{ opacity: 0, scale: 1.04 }}
                      animate={{ opacity: imgLoaded ? 1 : 0, scale: 1 }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                      style={{
                        position: "absolute", inset: 0,
                        width: "100%", height: "100%",
                        objectFit: "cover", objectPosition: "center",
                      }}
                    />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Coffee size={56} style={{ color: T.muted }} />
                    </div>
                  )}

                  {/* Category pill */}
                  {product.category_name && (
                    <div style={{
                      position: "absolute", top: 14, left: 14,
                      background: `${T.accent}EE`,
                      backdropFilter: "blur(6px)",
                      color: T.secondary,
                      fontSize: 9, fontWeight: 900, letterSpacing: ".14em", textTransform: "uppercase",
                      padding: "5px 12px", borderRadius: 99,
                      boxShadow: `0 4px 12px ${T.accent}50`,
                    }}>
                      {product.category_name}
                    </div>
                  )}
                </div>
              </div>

              {/* ── RIGHT: Details ────────────────────────────────────────────── */}
              <div
                className="w-full md:w-[58%]"
                style={{
                  padding: "28px 28px 28px 8px",
                  display: "flex", flexDirection: "column",
                  background: T.secondary,
                }}
              >
                {/* Product name + price */}
                <div style={{ marginBottom: 18 }}>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      fontSize: "clamp(24px, 4vw, 32px)",
                      fontWeight: 900, color: T.bg,
                      lineHeight: 1.1, marginBottom: 10,
                      paddingRight: 40,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {product.name}
                  </motion.h2>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: T.accent, letterSpacing: "-0.01em" }}>
                      ₱{currentPrice.toFixed(2)}
                    </span>
                    {/* Stock badge */}
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "4px 12px", borderRadius: 99,
                      background: inStock ? `${T.primary}CC` : "rgba(127,29,29,0.4)",
                      color: inStock ? T.bg : "#fca5a5",
                      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
                      border: `1px solid ${inStock ? T.border : "rgba(252,165,165,0.25)"}`,
                    }}>
                      <div style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: inStock ? T.accentSoft : "#f87171",
                        boxShadow: `0 0 6px ${inStock ? T.accent : "#f87171"}`,
                      }} />
                      {inStock ? `${currentYield} left` : "Sold Out"}
                    </div>
                  </div>
                </div>

                {/* Thin decorative rule */}
                <div style={{ height: 1, background: `linear-gradient(90deg, ${T.borderHi}, transparent)`, marginBottom: 18 }} />

                {/* Description */}
                <p style={{ fontSize: 14, color: T.bgDim, lineHeight: 1.75, marginBottom: 28 }}>
                  {product.description ?? "No description available."}
                </p>

                {/* Size selector */}
                {hasSizes && (
                  <div style={{ marginBottom: 28 }}>
                    <p style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".14em", color: T.accent, marginBottom: 12 }}>
                      Select Size
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {product.sizes.slice().sort((a, b) => a.sort_order - b.sort_order).map((size) => {
                        const isSelected    = selectedSize?.size_id === size.size_id;
                        const isUnavailable = size.max_yield === 0;
                        return (
                          <motion.button
                            key={size.size_id}
                            whileHover={isUnavailable ? {} : { y: -2 }}
                            whileTap={isUnavailable ? {} : { scale: 0.96 }}
                            onClick={() => !isUnavailable && setSelectedSize(size)}
                            disabled={isUnavailable}
                            style={{
                              flex: "1 1 80px",
                              padding: "12px 14px", borderRadius: 14,
                              cursor: isUnavailable ? "not-allowed" : "pointer",
                              opacity: isUnavailable ? .3 : 1,
                              background: isSelected ? T.accent : T.surface,
                              color: isSelected ? T.secondary : T.bg,
                              border: `1px solid ${isSelected ? T.accent : T.border}`,
                              boxShadow: isSelected ? `0 6px 20px ${T.accent}45` : "none",
                              transition: "all .18s ease",
                              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                            }}
                          >
                            <span style={{ fontSize: 13.5, fontWeight: 800 }}>{size.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, opacity: isSelected ? 0.85 : 0.55 }}>
                              ₱{size.price.toFixed(2)}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Qty + CTA */}
                <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
                  {/* Qty stepper */}
                  <div style={{
                    display: "flex", alignItems: "center",
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 14, overflow: "hidden",
                  }}>
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      style={{
                        width: 44, height: 50, border: "none",
                        background: "transparent", color: T.accent,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background .15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = T.primary}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <Minus size={16} strokeWidth={2.5} />
                    </button>
                    <span style={{ width: 36, textAlign: "center", fontSize: 17, fontWeight: 900, color: T.bg, userSelect: "none" }}>
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(q => Math.min(currentYield, q + 1))}
                      disabled={!inStock || quantity >= currentYield}
                      style={{
                        width: 44, height: 50, border: "none",
                        background: "transparent", color: T.accent,
                        cursor: !inStock || quantity >= currentYield ? "not-allowed" : "pointer",
                        opacity: !inStock || quantity >= currentYield ? .3 : 1,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background .15s",
                      }}
                      onMouseEnter={e => { if (inStock && quantity < currentYield) e.currentTarget.style.background = T.primary; }}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <Plus size={16} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Add to cart */}
                  <motion.button
                    disabled={!inStock}
                    whileHover={inStock ? { y: -2, boxShadow: `0 12px 32px ${T.accent}60` } : {}}
                    whileTap={inStock ? { scale: 0.97 } : {}}
                    style={{
                      flex: 1, height: 50, borderRadius: 14, border: "none",
                      background: inStock
                        ? `linear-gradient(135deg, ${T.accentSoft} 0%, ${T.accent} 100%)`
                        : T.surface,
                      color: inStock ? T.secondary : T.muted,
                      fontSize: 14, fontWeight: 900, letterSpacing: "0.03em",
                      cursor: inStock ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: inStock ? `0 6px 22px ${T.accent}45` : "none",
                      transition: "box-shadow .2s",
                    }}
                  >
                    <ShoppingBag size={18} strokeWidth={2.5} />
                    {inStock ? `Add to Bag  ·  ₱${totalPrice.toFixed(2)}` : "Sold Out"}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* ── BOTTOM SECTION: Full-Width Reviews ────────────────────────── */}
            <div style={{ padding: "12px 28px 40px 28px", width: "100%" }}>
              {/* Divider before reviews */}
              <div style={{ marginBottom: 28, height: 1, background: `linear-gradient(90deg, transparent, ${T.borderHi} 50%, transparent)` }} />
              
              <InlineReviews productId={product.product_id} tenantId={tenantId} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};