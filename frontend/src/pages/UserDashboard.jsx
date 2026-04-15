import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  RiStarFill, RiSendPlaneLine, RiFileTextLine,
  RiAlertLine, RiCheckboxCircleLine, RiCloseCircleLine, RiTimeLine,
  RiEditLine, RiArrowGoBackLine, RiDeleteBin6Line
} from 'react-icons/ri';
import AIInsights from '../components/AIInsights';
import ReviewTimeline from '../components/ReviewTimeline';
import HighlightedText from '../components/HighlightedText';
import DuplicateWarningModal from '../components/DuplicateWarningModal';
import ToxicityWarningModal from '../components/ToxicityWarningModal';

// Environment-aware Socket.io setup
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const socket = io(SOCKET_URL, { 
  autoConnect: false,
  transports: ['websocket'], // Enforced websocket only as per production best practices
  reconnectionAttempts: 10,
  reconnectionDelay: 2000
});

const STAT_CARDS = [
  { key: 'total',    label: 'Total Reviews',    icon: RiFileTextLine,       color: 'text-brand-400',   bg: 'bg-brand-500/10' },
  { key: 'pending',  label: 'Pending',           icon: RiTimeLine,           color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  { key: 'approved', label: 'Approved',          icon: RiCheckboxCircleLine, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { key: 'rejected', label: 'Rejected',          icon: RiCloseCircleLine,    color: 'text-rose-400',    bg: 'bg-rose-500/10' },
];

export default function UserDashboard() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedReview, setExpandedReview] = useState(null);
  const [form, setForm] = useState({ productName: '', rating: 5, reviewText: '' });
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [hasRevised, setHasRevised] = useState(false);
  
  // Duplicate Modal State
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateData, setDuplicateData] = useState(null);

  // Toxicity Modal State
  const [showToxicityModal, setShowToxicityModal] = useState(false);
  const [toxicityData, setToxicityData] = useState(null);

  // Deletion State
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await api.get('/reviews/my');
      setReviews(res.data);
    } catch {
      toast.error('Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();

    // join() must be called AFTER the socket is confirmed connected.
    // Calling emit() immediately after connect() races the handshake and is silently lost.
    const joinRoom = () => {
      socket.emit('join', user.id);
      console.log('[Socket] Joining room for user:', user.id);
    };

    socket.on('connect', joinRoom);

    // Re-join room automatically if the connection drops and recovers
    socket.on('reconnect', joinRoom);

    socket.on('review:status-updated', (data) => {
      setReviews((prev) =>
        prev.map((r) =>
          r._id === data.reviewId ? { ...r, status: data.status } : r
        )
      );
      if (data.status === 'approved') {
        toast.success(data.message, { duration: 6000 });
      } else {
        toast.error(data.message, { duration: 6000 });
      }
      fetchReviews(); // Refresh to get updated timeline
    });

    // Fired by the AI worker when background toxicity analysis finishes
    socket.on('review:ai-complete', (data) => {
      setReviews((prev) =>
        prev.map((r) =>
          r._id === data.reviewId
            ? {
                ...r,
                aiStatus:         data.aiStatus,
                toxicityScore:    data.toxicityScore,
                toxicityFlags:    data.toxicityFlags,
                detectedKeywords: data.detectedKeywords
              }
            : r
        )
      );
    });

    // Fired when the worker detects the review is toxic — show toast
    socket.on('review:ai-flagged', (data) => {
      toast.error(data.message, { duration: 7000, icon: '⚠️' });
    });

    socket.connect();

    return () => {
      socket.off('connect', joinRoom);
      socket.off('reconnect', joinRoom);
      socket.off('review:status-updated');
      socket.off('review:ai-complete');
      socket.off('review:ai-flagged');
      socket.disconnect();
    };
  }, [user.id, fetchReviews]);

  const validate = () => {
    const e = {};
    if (!form.productName.trim()) e.productName = 'Product name is required.';
    if (!form.reviewText.trim()) e.reviewText = 'Review text is required.';
    else if (form.reviewText.trim().length < 10) e.reviewText = 'Review must be at least 10 characters.';
    return e;
  };

  const handleEdit = (review) => {
    setEditingId(review._id);
    setHasRevised(false); // Reset for the new editing session
    setForm({
      productName: review.productName,
      rating: review.rating,
      reviewText: review.reviewText
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setHasRevised(false);
    setForm({ productName: '', rating: 5, reviewText: '' });
    setErrors({});
  };

  const handleSubmit = async (e, confirmSubmitAnyway = false) => {
    if (e) e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      let res;
      // If user already revised once, we force confirmation
      const finalConfirm = confirmSubmitAnyway || hasRevised;
      const payload = { ...form, confirmDuplicate: finalConfirm, confirmToxicity: finalConfirm, wasRevised: hasRevised };

      if (editingId) {
        res = await api.put(`/reviews/${editingId}`, payload);
        toast.success('Review updated successfully!', { duration: 4000 });
        setReviews((prev) => prev.map(r => r._id === editingId ? res.data.review : r));
        setEditingId(null);
        setHasRevised(false);
      } else {
        res = await api.post('/reviews', payload);
        toast.success('Review submitted successfully!', { duration: 4000, icon: '✅' });
        setReviews((prev) => [res.data.review, ...prev]);
        setHasRevised(false);
      }

      setForm({ productName: '', rating: 5, reviewText: '' });
      setShowDuplicateModal(false);
      setShowToxicityModal(false);
      setHasRevised(false);
    } catch (err) {
      if (err.response?.status === 422 && !hasRevised && !confirmSubmitAnyway) {
        setToxicityData(err.response.data.aiAnalysis.toxicity);
        setShowToxicityModal(true);
      } else if (err.response?.status === 409 && !hasRevised && !confirmSubmitAnyway) {
        // Duplicate detected and user hasn't revised yet
        setDuplicateData(err.response.data.aiAnalysis.duplicate);
        setShowDuplicateModal(true);
      } else {
        const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Submission failed.';
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalRevise = () => {
    setShowDuplicateModal(false);
    setHasRevised(true);
    // Focus is already back on form
    toast('You can now revise your review once before final submission.', { icon: '✍️' });
  };

  const handleModalSubmitAnyway = () => {
    handleSubmit(null, true);
  };

  const handleToxicityModalRevise = () => {
    setShowToxicityModal(false);
    setHasRevised(true);
    toast('Please revise your review to align with guidelines.', { icon: '✍️' });
  };

  const handleToxicityModalSubmitAnyway = () => {
    handleSubmit(null, true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/reviews/${deleteConfirm}`);
      toast.success('Review deleted successfully.');
      setReviews(prev => prev.filter(r => r._id !== deleteConfirm));
      setDeleteConfirm(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete review.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="page-header mb-8">
        <h1 className="page-title text-3xl font-bold">
          Welcome back, <span className="gradient-text">{user.name}</span>
        </h1>
        <p className="page-subtitle text-slate-400">Submit and track your product reviews</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(({ key, label, icon: Icon, color, bg }) => (
          <div key={key} className="card flex items-center gap-4 bg-surface-800 p-4 rounded-xl border border-surface-700">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`text-xl ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats[key]}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Submit Review Form - ONLY FOR USERS */}
        {user.role === 'user' && (
          <div className="lg:col-span-2">
            <div className="card bg-surface-800 p-6 rounded-2xl border border-surface-700 shadow-xl">
              <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <RiSendPlaneLine className="text-brand-400" />
                Submit a Review
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="productName" className="label text-sm text-slate-300 mb-1 block">Product Name</label>
                  <input
                    id="productName"
                    type="text"
                    value={form.productName}
                    onChange={(e) => setForm({ ...form, productName: e.target.value })}
                    placeholder="e.g. MacBook Pro M3"
                    className={`input w-full bg-surface-900 border border-surface-600 rounded-lg p-2.5 text-white ${errors.productName ? 'border-rose-500/50 focus:border-rose-500' : 'focus:border-brand-500'}`}
                  />
                  {errors.productName && <p className="text-xs text-rose-400 mt-1">{errors.productName}</p>}
                </div>

                <div>
                  <label className="label text-sm text-slate-300 mb-1 block">Rating</label>
                  <div className="flex gap-2 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setForm({ ...form, rating: star })}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <RiStarFill
                          className={`text-2xl transition-colors ${
                            star <= form.rating ? 'text-amber-400' : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-sm text-slate-400 self-center ml-1">
                      {form.rating}/5
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="reviewText" className="label text-sm text-slate-300 mb-1 block">
                    Review
                    <span className="ml-auto text-slate-500 text-xs float-right">{form.reviewText.length}/2000</span>
                  </label>
                  <textarea
                    id="reviewText"
                    value={form.reviewText}
                    onChange={(e) => setForm({ ...form, reviewText: e.target.value })}
                    placeholder="Share your honest experience..."
                    rows={5}
                    maxLength={2000}
                    className={`input w-full bg-surface-900 border border-surface-600 rounded-lg p-2.5 text-white resize-none ${errors.reviewText ? 'border-rose-500/50 focus:border-rose-500' : 'focus:border-brand-500'}`}
                  />
                  {errors.reviewText && <p className="text-xs text-rose-400 mt-1">{errors.reviewText}</p>}
                </div>

                <div className="flex gap-3">
                  {editingId && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="btn-secondary flex-1 bg-surface-700 hover:bg-surface-600 text-white font-semibold py-3 rounded-xl transition-all border border-surface-600 flex items-center justify-center gap-2"
                    >
                      <RiArrowGoBackLine />
                      Cancel
                    </button>
                  )}
                  <button
                    id="submit-review-btn"
                    type="submit"
                    disabled={submitting}
                    className={`btn-primary ${editingId ? 'flex-[2]' : 'w-full'} bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2`}
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {editingId ? 'Updating...' : 'Submitting...'}
                      </>
                    ) : (
                      <>
                        {editingId ? <RiEditLine /> : <RiSendPlaneLine />}
                        {editingId ? 'Update Review' : 'Submit Review'}
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-4 p-3 rounded-xl bg-surface-700/30 border border-surface-600 text-[11px] text-slate-400 flex items-start gap-2">
                <RiAlertLine className="text-brand-400 shrink-0 mt-0.5 text-sm" />
                <span>AI instantly analyzes reviews for duplicate submissions and community guidelines violations upon submission.</span>
              </div>
            </div>
          </div>
        )}

        {/* My Reviews Table */}
        <div className={user.role === 'user' ? 'lg:col-span-3' : 'lg:col-span-12'}>
          <div className="card bg-surface-800 p-6 rounded-2xl border border-surface-700 shadow-xl overflow-hidden">
            <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
              <RiFileTextLine className="text-brand-400" />
              My History & Lifecycle
            </h2>

            {loading ? (
              <LoadingSpinner className="py-12" />
            ) : reviews.length === 0 ? (
              <div className="text-center py-12">
                <RiFileTextLine className="text-5xl text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No reviews yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review._id}
                    className="p-5 rounded-xl bg-surface-700/40 border border-surface-600 hover:border-surface-500 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-bold text-white text-base">{review.productName}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1,2,3,4,5].map(s => (
                            <RiStarFill key={s} className={`text-xs ${s <= review.rating ? 'text-amber-400' : 'text-slate-600'}`} />
                          ))}
                        </div>
                      </div>
                      <StatusBadge status={review.status} />
                    </div>
                    
                    <div className="text-sm text-slate-300 leading-relaxed mb-4">
                      <HighlightedText text={review.reviewText} keywords={review.detectedKeywords} />
                    </div>

                    <div className="flex items-center gap-3 flex-wrap border-t border-surface-600 pt-3">
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>

                      {/* AI processing status badges */}
                      {review.aiStatus === 'processing' && (
                        <span className="px-2 py-0.5 bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[10px] font-bold rounded uppercase flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                          AI Analyzing...
                        </span>
                      )}
                      {review.aiStatus === 'failed' && (
                        <span className="px-2 py-0.5 bg-slate-500/10 text-slate-500 border border-slate-500/20 text-[10px] font-bold rounded uppercase">
                          ⚠ AI Unavailable
                        </span>
                      )}

                      {/* Only show AI flags once analysis is complete */}
                      {review.aiStatus !== 'processing' && review.toxicityScore > 0.3 && (
                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold rounded uppercase">
                          ⚠ AI Flagged: Toxic
                        </span>
                      )}

                      {review.isDuplicate && (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold rounded uppercase">
                          🔁 AI Flagged: Duplicate
                        </span>
                      )}

                      <button 
                        onClick={() => setDeleteConfirm(review._id)}
                        className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 px-2 py-1 bg-rose-500/10 rounded-lg border border-rose-500/20"
                      >
                        <RiDeleteBin6Line />
                        Delete
                      </button>

                      <button 
                        onClick={() => setExpandedReview(expandedReview === review._id ? null : review._id)}
                        className="ml-auto text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
                      >
                        {expandedReview === review._id ? 'Close Details' : 'View Lifecycle & AI Insights'}
                        <RiTimeLine className={expandedReview === review._id ? 'rotate-180' : ''} />
                      </button>
                    </div>

                    {expandedReview === review._id && (
                      <div className="mt-4 pt-4 border-t border-surface-600 animate-slide-down">
                        <AIInsights 
                          toxicityScore={review.toxicityScore}
                          detectedKeywords={review.detectedKeywords}
                          similarity={review.duplicateSimilarity}
                          isDuplicate={review.isDuplicate}
                          matchedText={review.duplicateOf?.reviewText}
                          matchedProduct={review.duplicateOf?.productName}
                          currentText={review.reviewText}
                        />
                        <div className="mt-6">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-2">Review Lifecycle Timeline</h4>
                          <ReviewTimeline timeline={review.timeline} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <DuplicateWarningModal 
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        data={duplicateData}
        onEdit={handleModalRevise}
        onSubmitAnyway={handleModalSubmitAnyway}
      />

      <ToxicityWarningModal
        isOpen={showToxicityModal}
        onClose={() => setShowToxicityModal(false)}
        data={toxicityData}
        text={form.reviewText}
        onEdit={handleToxicityModalRevise}
        onSubmitAnyway={handleToxicityModalSubmitAnyway}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-sm w-full bg-surface-800 border border-rose-500/30 rounded-3xl shadow-2xl p-6 animate-scale-up">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 flex items-center justify-center mb-6 mx-auto">
              <RiDeleteBin6Line className="text-3xl text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Delete Review?</h3>
            <p className="text-sm text-slate-400 text-center mb-8">
              This will hide the review from your dashboard. This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-6 py-3 bg-surface-700 hover:bg-surface-600 text-white font-bold rounded-xl transition-all border border-surface-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
              >
                {deleteLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
