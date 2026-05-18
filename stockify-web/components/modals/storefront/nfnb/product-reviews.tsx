"use client";

import React, { useState, useEffect } from "react";
import { Star, Trash2, Edit2, Check, X } from "lucide-react";
import { fetchReviews, submitReview, deleteReview, updateReview } from "@/lib/customer/customer-actions";
import { createClient } from "@/lib/supabase/client";

interface ProductReviewsProps {
  productId: string;
  productType: 'fnb' | 'nfb';
  tenantId: string;
}

export const ProductReviews = ({ productId, productType, tenantId }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Edit state
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      
      const { data } = await fetchReviews(productId, productType);
      setReviews(data ?? []);
      setLoading(false);
    };
    init();
  }, [productId, productType]);

  const loadReviews = async () => {
    const { data } = await fetchReviews(productId, productType);
    setReviews(data ?? []);
  };

  const handleSubmit = async () => {
    if (!userId) return;
    setSubmitting(true);
    const { error } = await submitReview({
      tenantId,
      productId,
      productType,
      rating,
      comment,
    });
    setSubmitting(false);
    if (!error) {
      setComment("");
      setRating(5);
      loadReviews();
    } else {
      alert(error);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    const { error } = await deleteReview(reviewId);
    if (!error) {
      loadReviews();
    }
  };

  const handleUpdate = async (reviewId: string) => {
    setSubmitting(true);
    const { error } = await updateReview(reviewId, rating, comment);
    setSubmitting(false);
    if (!error) {
      setEditingReviewId(null);
      setComment("");
      setRating(5);
      loadReviews();
    }
  };

  const startEdit = (review: any) => {
    setEditingReviewId(review.review_id);
    setRating(review.rating);
    setComment(review.comment);
  };

  const cancelEdit = () => {
    setEditingReviewId(null);
    setComment("");
    setRating(5);
  };

  const userHasReviewed = reviews.some((r) => r.user_id === userId);

  if (loading) {
    return <div className="text-center text-xs text-[#385E31]/50 py-4">Loading reviews...</div>;
  }

  return (
    <div className="border-t border-[#385E31]/10 pt-5 mt-2">
      <h3 className="text-[#385E31] text-[16px] font-black uppercase mb-3">Customer Reviews</h3>

      {/* Review Form (Only show if logged in and hasn't reviewed yet, or is editing) */}
      {userId && (!userHasReviewed || editingReviewId) && (
        <div className="bg-white/60 p-4 rounded-xl border border-[#385E31]/10 mb-4">
          <p className="text-[12px] font-bold text-[#385E31]/60 mb-2">
            {editingReviewId ? "Edit your review" : "Leave a review"}
          </p>
          
          {/* Star Rating Input */}
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setRating(s)}
                className="text-[#F7B71D] hover:scale-110 transition-transform"
              >
                <Star size={18} fill={s <= rating ? "#F7B71D" : "none"} />
              </button>
            ))}
          </div>

          {/* Comment Input */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this product..."
            className="w-full border border-[#385E31]/20 rounded-lg px-4 py-2 bg-transparent text-[#385E31] placeholder-[#385E31]/30 outline-none text-sm resize-none h-20 focus:ring-1 focus:ring-[#385E31]/30"
          />

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-2">
            {editingReviewId ? (
              <>
                <button
                  onClick={cancelEdit}
                  className="px-4 py-1.5 rounded-full text-xs font-bold border border-[#385E31]/20 text-[#385E31] hover:bg-[#385E31]/5"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdate(editingReviewId)}
                  disabled={submitting}
                  className="bg-[#385E31] text-[#FFFCEB] px-4 py-1.5 rounded-full text-xs font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
                >
                  {submitting ? "Updating..." : <><Check size={12} /> Update</>}
                </button>
              </>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                className="bg-[#385E31] text-[#FFFCEB] px-5 py-1.5 rounded-full text-xs font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="flex flex-col gap-4">
        {reviews.length === 0 ? (
          <div className="text-center py-6 text-[#385E31]/40 text-sm">
            <p>No reviews yet.</p>
            {!userHasReviewed && <p className="text-xs">Be the first to review this product!</p>}
          </div>
        ) : (
          reviews.map((r: any) => (
            <div key={r.review_id} className="border-b border-[#385E31]/5 pb-3 last:border-0">
              <div className="flex items-center gap-3 mb-2">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-[#F7B71D] flex items-center justify-center text-[#385E31] font-bold text-sm flex-shrink-0">
                  {r.users?.display_name?.[0]?.toUpperCase() || "U"}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    {/* Nickname */}
                    <p className="text-[#385E31] font-bold text-sm truncate">
                      {r.users?.display_name || "User"}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#385E31]/40">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                      
                      {/* Edit/Delete Actions for Owner */}
                      {userId === r.user_id && !editingReviewId && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(r)}
                            className="text-[#385E31]/60 hover:text-[#385E31] p-1"
                            title="Edit review"
                          >
                            <Edit2 size={10} />
                          </button>
                          <button
                            onClick={() => handleDelete(r.review_id)}
                            className="text-red-400 hover:text-red-500 p-1"
                            title="Delete review"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Stars */}
                  <div className="flex gap-0.5 text-[#F7B71D]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={10} fill={i < r.rating ? "#F7B71D" : "none"} />
                    ))}
                  </div>
                </div>
              </div>
              
              <p className="text-[#385E31] text-[13px] leading-snug pl-11">
                {r.comment || <span className="text-[#385E31]/40 italic">No comment left.</span>}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
