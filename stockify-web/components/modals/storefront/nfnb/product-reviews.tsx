"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Trash2, Edit2, Check, MessageSquare } from "lucide-react";
import { fetchReviews, submitReview, deleteReview, updateReview } from "@/lib/customer/customer-actions";
import { createClient } from "@/lib/supabase/client";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  primary:     "#385E31",
  primaryDark: "#254020",
  primaryFade: "#385E3115",
  accent:      "#F7B71D",
  accentDark:  "#D49B15",
  bg:          "#FCFCFA",
  surface:     "#FFFFFF",
  textMain:    "#1A2617",
  textMuted:   "#6B7280",
  border:      "#E5E7EB",
};

const avatarGradients = [
  `linear-gradient(135deg, ${T.primary}, #5A8551)`,
  `linear-gradient(135deg, ${T.accent}, #FFC94D)`,
  `linear-gradient(135deg, #4A7A41, #6DA363)`,
  `linear-gradient(135deg, #D49B15, #FAD06C)`,
];
const getGradient = (name: string) => avatarGradients[(name.charCodeAt(0) || 0) % avatarGradients.length];

// ── Star component ────────────────────────────────────────────────────────────
function Stars({
  rating, size = 14, interactive = false, onChange,
}: {
  rating: number; size?: number; interactive?: boolean; onChange?: (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const effective = interactive && hovered ? hovered : rating;
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s} type="button" disabled={!interactive}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => interactive && setHovered(s)}
          onMouseLeave={() => interactive && setHovered(0)}
          style={{
            background: "none", border: "none", padding: 0,
            cursor: interactive ? "pointer" : "default",
            transform: interactive && hovered >= s ? "scale(1.2)" : "scale(1)",
            transition: "transform .2s cubic-bezier(0.34, 1.56, 0.64, 1)",
            display: "flex",
          }}
        >
          <Star
            size={size}
            fill={s <= effective ? T.accent : "none"}
            stroke={s <= effective ? T.accent : "#D1D5DB"}
            strokeWidth={s <= effective ? 1 : 1.5}
          />
        </button>
      ))}
    </div>
  );
}

// ── Rating summary bar ────────────────────────────────────────────────────────
function RatingBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, width: 12, textAlign: "right" }}>
        {label}
      </span>
      <div style={{
        flex: 1, height: 8, borderRadius: 99,
        background: T.border, overflow: "hidden",
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          style={{
            height: "100%", background: T.accent, borderRadius: 99,
          }}
        />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, width: 16 }}>
        {count}
      </span>
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────
interface ProductReviewsProps {
  productId: string;
  productType: "fnb" | "nfb";
  tenantId: string;
}

// ── Component ────────────────────────────────────────────────────────────────
export const ProductReviews = ({ productId, productType, tenantId }: ProductReviewsProps) => {
  const [reviews, setReviews]           = useState<any[]>([]);
  const [userId, setUserId]             = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);
  const [rating, setRating]             = useState(5);
  const [comment, setComment]           = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [editingReviewId, setEditingId] = useState<string | null>(null);
  const [focused, setFocused]           = useState(false);

  const loadReviews = async () => {
    const { data } = await fetchReviews(productId, productType);
    setReviews(data ?? []);
  };

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      await loadReviews();
      setLoading(false);
    })();
  }, [productId, productType]);

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const userHasReviewed = reviews.some((r) => r.user_id === userId);
  const maxCount = Math.max(1, ...[1,2,3,4,5].map(s => reviews.filter(r => r.rating === s).length));

  const handleSubmit = async () => {
    if (!userId) return;
    setSubmitting(true);
    const { error } = await submitReview({ tenantId, productId, productType, rating, comment });
    setSubmitting(false);
    if (!error) { setComment(""); setRating(5); loadReviews(); }
    else alert(error);
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    const { error } = await deleteReview(reviewId);
    if (!error) loadReviews();
  };

  const handleUpdate = async (reviewId: string) => {
    setSubmitting(true);
    const { error } = await updateReview(reviewId, rating, comment);
    setSubmitting(false);
    if (!error) { setEditingId(null); setComment(""); setRating(5); loadReviews(); }
  };

  const startEdit = (review: any) => { setEditingId(review.review_id); setRating(review.rating); setComment(review.comment); };
  const cancelEdit = () => { setEditingId(null); setComment(""); setRating(5); };

  if (loading) return (
    <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 32, marginTop: 16 }}>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", padding: "24px 0" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: "50%", background: T.primary,
            animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`@keyframes dotBounce { 0%,100%{transform:translateY(0);opacity:.3} 50%{transform:translateY(-8px);opacity:1} }`}</style>
    </div>
  );

  return (
    <div style={{
      borderTop: `1px solid ${T.border}`,
      paddingTop: 32, marginTop: 16,
      fontFamily: "inherit",
    }}>

      {/* ── Section header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 24 }}>
        <div>
          <h3 style={{
            fontSize: 22, fontWeight: 800, color: T.textMain,
            letterSpacing: "-.01em", lineHeight: 1.2, marginBottom: 12
          }}>
            Customer Reviews
          </h3>
          {reviews.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Stars rating={Math.round(avg)} size={18} />
              <span style={{ fontSize: 18, fontWeight: 800, color: T.textMain }}>
                {avg.toFixed(1)}
              </span>
              <span style={{
                fontSize: 13, color: T.textMuted, fontWeight: 600,
                padding: "4px 12px", borderRadius: 99,
                background: T.surface, border: `1px solid ${T.border}`,
              }}>
                {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </span>
            </div>
          )}
        </div>

        {/* Distribution bars */}
        {reviews.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 160 }}>
            {[5, 4, 3, 2, 1].map(s => (
              <RatingBar
                key={s} label={String(s)}
                count={reviews.filter(r => r.rating === s).length} max={maxCount}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Review form ── */}
      {userId && (!userHasReviewed || editingReviewId) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: T.surface,
            border: `1px solid ${focused ? T.primary : T.border}`,
            borderRadius: 16, padding: "24px", marginBottom: 32,
            transition: "border-color .2s, box-shadow .2s",
            boxShadow: focused ? `0 4px 20px rgba(0,0,0,0.06)` : `0 2px 8px rgba(0,0,0,0.02)`,
          }}
        >
          <p style={{
            fontSize: 11, fontWeight: 800, letterSpacing: ".1em",
            textTransform: "uppercase", color: T.primary, marginBottom: 16,
          }}>
            {editingReviewId ? "Edit your review" : "Leave a review"}
          </p>

          <Stars rating={rating} size={28} interactive onChange={setRating} />

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Share your thoughts about this product…"
            rows={4}
            style={{
              width: "100%", marginTop: 16, padding: "16px",
              background: T.bg, border: `1px solid ${focused ? T.primary : T.border}`,
              borderRadius: 12, fontSize: 14, color: T.textMain,
              resize: "none", outline: "none", lineHeight: 1.6,
              transition: "border-color .2s", boxSizing: "border-box",
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            {editingReviewId && (
              <button
                onClick={cancelEdit}
                style={{
                  padding: "10px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600,
                  border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted,
                  cursor: "pointer", transition: "background .2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.bg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => editingReviewId ? handleUpdate(editingReviewId) : handleSubmit()}
              disabled={submitting || rating === 0}
              style={{
                padding: "10px 28px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                background: T.primary, color: "#FFF", border: "none",
                cursor: submitting || rating === 0 ? "not-allowed" : "pointer",
                opacity: rating === 0 ? .6 : 1, display: "flex", alignItems: "center", gap: 8,
                boxShadow: `0 3px 0 ${T.primaryDark}`, transition: "transform .1s, box-shadow .1s",
              }}
              onMouseDown={e => { if (!(submitting || rating === 0)) { e.currentTarget.style.transform = "translateY(3px)"; e.currentTarget.style.boxShadow = "none"; } }}
              onMouseUp={e => { if (!(submitting || rating === 0)) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 3px 0 ${T.primaryDark}`; } }}
              onMouseLeave={e => { if (!(submitting || rating === 0)) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 3px 0 ${T.primaryDark}`; } }}
            >
              {submitting ? "Saving…" : editingReviewId ? <><Check size={16} /> Update</> : "Submit Review"}
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Reviews list ── */}
      <AnimatePresence>
        {reviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", background: T.surface, border: `1px dashed ${T.border}`, borderRadius: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", background: T.primaryFade,
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            }}>
              <MessageSquare size={28} style={{ color: T.primary }} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 800, color: T.textMain, marginBottom: 8 }}>
              No reviews yet
            </p>
            <p style={{ fontSize: 14, color: T.textMuted }}>
              {!userHasReviewed ? "Be the first to review this product!" : ""}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {reviews.map((r: any, idx: number) => (
              <motion.div
                key={r.review_id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ delay: idx * 0.05 }}
                style={{
                  background: T.surface, border: `1px solid ${T.border}`,
                  borderRadius: 16, padding: "24px",
                }}
              >
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  {/* Avatar */}
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                    background: getGradient(r.users?.display_name ?? "U"), color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 18, boxShadow: `0 4px 12px rgba(0,0,0,.08)`,
                  }}>
                    {r.users?.display_name?.[0]?.toUpperCase() ?? "U"}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Name row */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 800, color: T.textMain, marginBottom: 6 }}>
                          {r.users?.display_name ?? "Anonymous"}
                        </p>
                        <Stars rating={r.rating} size={14} />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span style={{
                          fontSize: 12, color: T.textMuted, fontWeight: 600,
                          padding: "4px 10px", borderRadius: 99, background: T.bg, border: `1px solid ${T.border}`,
                        }}>
                          {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>

                        {userId === r.user_id && !editingReviewId && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => startEdit(r)} title="Edit review"
                              style={{
                                width: 32, height: 32, borderRadius: 8, border: "none",
                                background: T.primaryFade, color: T.primary,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", transition: "background .2s",
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = `${T.primary}30`}
                              onMouseLeave={e => e.currentTarget.style.background = T.primaryFade}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(r.review_id)} title="Delete review"
                              style={{
                                width: 32, height: 32, borderRadius: 8, border: "none",
                                background: "#FEE2E2", color: "#DC2626",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", transition: "background .2s",
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "#FECACA"}
                              onMouseLeave={e => e.currentTarget.style.background = "#FEE2E2"}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Comment */}
                    <p style={{
                      fontSize: 15, lineHeight: 1.6, marginTop: 16,
                      color: r.comment ? T.textMain : T.textMuted,
                      fontStyle: r.comment ? "normal" : "italic",
                    }}>
                      {r.comment || "No comment left."}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};