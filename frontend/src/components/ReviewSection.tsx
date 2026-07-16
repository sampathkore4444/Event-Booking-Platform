import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { reviewService } from '../services/review.service';
import StarRating from './StarRating';
import type { Review, ReviewStats } from '../types';
import { format } from 'date-fns';
import { MessageSquare, ThumbsUp, Trash2, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReviewSectionProps {
  eventId: string;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ eventId }) => {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const [reviewsData, statsData] = await Promise.all([
        reviewService.getEventReviews(eventId),
        reviewService.getReviewStats(eventId),
      ]);
      setReviews(reviewsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [eventId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      toast.error('Please write a comment');
      return;
    }
    setIsSubmitting(true);
    try {
      await reviewService.createReview({
        event_id: eventId,
        rating: newRating,
        comment: newComment.trim(),
      });
      toast.success('Review submitted!');
      setShowForm(false);
      setNewComment('');
      setNewRating(5);
      await fetchReviews();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err?.response?.data?.detail || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (reviewId: string) => {
    if (!newComment.trim()) {
      toast.error('Please write a comment');
      return;
    }
    setIsSubmitting(true);
    try {
      await reviewService.updateReview(reviewId, {
        rating: newRating,
        comment: newComment.trim(),
      });
      toast.success('Review updated!');
      setEditingId(null);
      setNewComment('');
      setNewRating(5);
      await fetchReviews();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err?.response?.data?.detail || 'Failed to update review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await reviewService.deleteReview(reviewId);
      toast.success('Review deleted');
      await fetchReviews();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err?.response?.data?.detail || 'Failed to delete review');
    }
  };

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setNewRating(review.rating);
    setNewComment(review.comment || '');
  };

  const userReview = reviews.find(r => r.user_id === user?.id);
  const hasReviewed = !!userReview;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 pt-8 border-t border-gray-100">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-brand-500" />
            Reviews & Ratings
          </h2>
          {stats && stats.total > 0 && (
            <div className="flex items-center gap-3 mt-2">
              <StarRating rating={stats.average_rating} size={18} showValue />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({stats.total} {stats.total === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>
        {isAuthenticated && !hasReviewed && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary btn-sm"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Rating Distribution Bar */}
      {stats && stats.total > 0 && (          <div className="card p-6 mb-8 dark:bg-gray-900">
          <div className="flex items-start gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900 dark:text-white">{stats.average_rating}</div>
              <StarRating rating={stats.average_rating} size={14} />
              <div className="text-sm text-gray-500 mt-1">{stats.total} reviews</div>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.distribution[star.toString() as keyof typeof stats.distribution] || 0;
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-3 text-gray-500 text-xs">{star}</span>
                    <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs text-gray-500">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Write Review Form */}
      {showForm && (
        <div className="card p-6 mb-6 animate-fade-in">            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Write Your Review</h3>
          <div className="mb-4">
            <label className="label">Rating</label>
            <StarRating
              rating={newRating}
              interactive
              onChange={setNewRating}
              size={28}
            />
          </div>
          <div className="mb-4">
            <label className="label">Your Review</label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="input min-h-[100px] resize-none"
              placeholder="Share your experience... What did you like? What could be improved?"
              rows={4}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="btn-ghost btn-sm">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !newComment.trim()}
              className="btn-primary btn-sm"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}

      {/* Edit Review Form */}
      {editingId && (
        <div className="card p-6 mb-6 animate-fade-in border-2 border-brand-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Your Review</h3>
          <div className="mb-4">
            <label className="label">Rating</label>
            <StarRating
              rating={newRating}
              interactive
              onChange={setNewRating}
              size={28}
            />
          </div>
          <div className="mb-4">
            <label className="label">Your Review</label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="input min-h-[100px] resize-none"
              rows={4}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditingId(null);
                setNewComment('');
                setNewRating(5);
              }}
              className="btn-ghost btn-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => handleUpdate(editingId)}
              disabled={isSubmitting || !newComment.trim()}
              className="btn-primary btn-sm"
            >
              {isSubmitting ? 'Saving...' : 'Update Review'}
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`card p-6 transition-all ${
                review.user_id === user?.id ? 'border-brand-200 bg-brand-50/30' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {review.user?.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">
                        {review.user?.full_name || 'Anonymous'}
                      </span>
                      {review.is_verified && (
                        <ThumbsUp className="w-3.5 h-3.5 text-blue-500" />
                      )}
                      {review.user_id === user?.id && (
                        <span className="badge bg-brand-100 text-brand-700 text-[10px]">You</span>
                      )}
                    </div>
                    <StarRating rating={review.rating} size={14} />
                    <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm leading-relaxed">{review.comment}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {format(new Date(review.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                {review.user_id === user?.id && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(review)}
                      className="p-2 text-gray-400 hover:text-brand-500 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
