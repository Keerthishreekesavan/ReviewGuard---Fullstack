import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import AIInsights from '../components/AIInsights';
import HighlightedText from '../components/HighlightedText';
import {
  RiShieldCheckLine, RiSearchLine, RiFilterLine,
  RiCheckLine, RiCloseLine, RiAlertLine, RiRefreshLine,
  RiStarFill, RiUser3Line, RiTimeLine, RiFileListLine,
  RiArrowRightSLine, RiQuestionLine, RiHistoryLine, RiCloseCircleLine, RiDeleteBin6Line
} from 'react-icons/ri';

export default function ModeratorPanel() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedInsights, setExpandedInsights] = useState(null);

  const [filters, setFilters] = useState({
    status: 'pending',
    isDuplicate: '',
    isToxic: '',
    search: '',
    minToxicity: '0.3',
    minSimilarity: '0.7'
  });

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = { 
        page, 
        limit: 15, 
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')) 
      };
      
      const res = await api.get('/moderation/reviews', { params: queryParams });
      setReviews(res.data.reviews);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch {
      toast.error('Failed to fetch reviews.');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/moderation/audit-logs?limit=10');
      setAuditLogs(res.data.logs);
    } catch {
      toast.error('Failed to load audit logs.');
    }
  };

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleApprove = async (id) => {
    setActionLoading(id + '-approve');
    try {
      await api.put(`/moderation/reviews/${id}/approve`);
      toast.success('Review approved!');
      fetchReviews();
      if (showLogs) fetchAuditLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }
    setActionLoading(rejectModal + '-reject');
    try {
      await api.put(`/moderation/reviews/${rejectModal}/reject`, { reason: rejectReason });
      toast.success('Review rejected.');
      setRejectModal(null);
      setRejectReason('');
      fetchReviews();
      if (showLogs) fetchAuditLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFilterChange = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({
      status: 'pending',
      isDuplicate: '',
      isToxic: '',
      search: '',
      minToxicity: '0.3',
      minSimilarity: '0.7'
    });
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tight">
            <RiShieldCheckLine className="text-brand-500" />
            <span className="gradient-text">Moderation Hub</span>
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Verify and safeguard incoming content quality</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => { setShowLogs(!showLogs); if(!showLogs) fetchAuditLogs(); }} 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border shadow-lg ${
              showLogs 
                ? 'bg-brand-500 text-white border-brand-400 shadow-brand-500/20' 
                : 'bg-surface-800 text-slate-300 border-surface-700 hover:bg-surface-700'
            }`}
          >
            <RiHistoryLine className="text-lg" />
            {showLogs ? 'Ongoing Session' : 'My Recent Actions'}
          </button>
          
          <button 
            onClick={fetchReviews} 
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-surface-800 text-brand-400 border border-brand-500/20 hover:border-brand-500/50 hover:bg-surface-700 text-sm font-bold transition-all shadow-xl"
          >
            <RiRefreshLine className={loading ? 'animate-spin' : ''} />
            Scan Queue
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation & Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card bg-surface-800 p-6 rounded-3xl border border-surface-700 shadow-2xl sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <RiFilterLine className="text-brand-500" />
                Filter Engine
              </h3>
              <button 
                onClick={resetFilters}
                className="text-[10px] font-bold text-slate-500 hover:text-brand-400 transition-colors uppercase"
              >
                Reset All
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Search */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Quick Search</label>
                <div className="relative group">
                  <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Products, users..."
                    className="w-full bg-surface-900 border border-surface-700 rounded-xl pl-10 p-2.5 text-sm text-white focus:border-brand-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Content Status</label>
                <div className="flex flex-col gap-2">
                  {['pending', 'approved', 'rejected', 'deleted', 'all'].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleFilterChange('status', s)}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all border capitalize ${
                        filters.status === s 
                          ? 'bg-brand-500/10 text-brand-400 border-brand-400/40 shadow-inner' 
                          : 'bg-surface-700/30 text-slate-500 border-surface-700 hover:border-surface-600'
                      }`}
                    >
                      {s}
                      {filters.status === s && <div className="w-1.5 h-1.5 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Flags */}
              <div className="pt-4 border-t border-surface-700 space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">AI Flags</label>
                
                {/* Toxicity */}
                <div className="space-y-3">
                  <button
                    onClick={() => handleFilterChange('isToxic', filters.isToxic === 'true' ? '' : 'true')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-black uppercase transition-all border ${
                      filters.isToxic === 'true' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-surface-700/50 text-slate-500 border-surface-600'
                    }`}
                  >
                    <span>High Toxicity</span>
                    <RiAlertLine />
                  </button>
                  {filters.isToxic === 'true' && (
                    <div className="px-1">
                      <div className="flex justify-between text-[10px] font-bold text-rose-400 mb-1">
                        <span>Min Score</span>
                        <span>{Math.round(filters.minToxicity * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.05" 
                        value={filters.minToxicity}
                        onChange={(e) => handleFilterChange('minToxicity', e.target.value)}
                        className="w-full h-1 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                    </div>
                  )}
                </div>

                {/* Duplicates */}
                <div className="space-y-3">
                  <button
                    onClick={() => handleFilterChange('isDuplicate', filters.isDuplicate === 'true' ? '' : 'true')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-black uppercase transition-all border ${
                      filters.isDuplicate === 'true' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-surface-700/50 text-slate-500 border-surface-600'
                    }`}
                  >
                    <span>Duplicate Probability</span>
                    <RiCloseCircleLine />
                  </button>
                  {filters.isDuplicate === 'true' && (
                    <div className="px-1">
                      <div className="flex justify-between text-[10px] font-bold text-amber-400 mb-1">
                        <span>Threshold</span>
                        <span>{Math.round(filters.minSimilarity * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.05" 
                        value={filters.minSimilarity}
                        onChange={(e) => handleFilterChange('minSimilarity', e.target.value)}
                        className="w-full h-1 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-[10px] text-emerald-300 font-medium">
              <RiQuestionLine className="text-lg mb-2 opacity-50" />
              <p className="leading-relaxed">
                Filters are processed in real-time. The toxicity engine monitors abusive language patterns.
              </p>
            </div>
          </div>
        </div>

        {/* Reviews Feed Section */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 bg-surface-800/20 rounded-3xl border border-dashed border-surface-700">
              <LoadingSpinner size="lg" />
              <p className="text-slate-500 mt-6 font-bold tracking-widest text-[10px] uppercase">Retrieving Telemetry...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-24 bg-surface-800/40 rounded-3xl border border-surface-700 text-center animate-pulse">
              <div className="w-24 h-24 rounded-full bg-surface-700/50 flex items-center justify-center mb-6">
                <RiShieldCheckLine className="text-5xl text-slate-600" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Queue Clear</h3>
              <p className="text-slate-500 max-w-xs font-medium px-6">No data matches your current filter matrix. Check your search terms or thresholds.</p>
              <button onClick={resetFilters} className="mt-6 text-brand-400 font-bold text-xs underline decoration-brand-400/30 underline-offset-4">Reset Parameters</button>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review._id} className="group bg-surface-800 rounded-3xl border border-surface-700 hover:border-brand-500/30 shadow-2xl overflow-hidden transition-all duration-300">
                  <div className="p-8">
                    {/* Upper Metadata */}
                    <div className="flex items-start justify-between gap-6 mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-xl font-black text-white tracking-tight">{review.productName}</h3>
                          <StatusBadge status={review.status} />
                        </div>
                        <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <RiUser3Line className="text-brand-500" />
                            {review.userId?.name}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-surface-600"></span>
                          <span className="flex items-center gap-1.5">
                            <RiTimeLine className="text-brand-500" />
                            {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-surface-600"></span>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <RiStarFill key={s} className={`text-[10px] ${s <= review.rating ? 'text-amber-500' : 'text-slate-700'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Badge Section */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {review.toxicityScore > 0.3 && (
                          <div className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-black rounded-full uppercase tracking-tighter flex items-center gap-1.5 bg-blend-screen">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                            Flagged Toxicity
                          </div>
                        )}
                        {review.isDuplicate && (
                          <div className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black rounded-full uppercase tracking-tighter">
                            🔁 Duplicate Match
                          </div>
                        )}
                        {review.isDeleted && (
                          <div className="px-3 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[9px] font-black rounded-full uppercase tracking-tighter flex items-center gap-1.5">
                            <RiDeleteBin6Line className="text-amber-500" />
                            Deleted by User
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Review Content Card */}
                    <div className="bg-surface-900 border border-surface-700 rounded-2xl p-5 mb-6 relative hover:border-surface-600 transition-colors">
                      <p className="text-slate-200 leading-relaxed font-medium">
                        <HighlightedText text={review.reviewText} keywords={review.detectedKeywords} />
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-surface-700/50">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setExpandedInsights(expandedInsights === review._id ? null : review._id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                            expandedInsights === review._id 
                              ? 'bg-brand-500 text-white border-brand-400' 
                              : 'bg-surface-700/50 text-slate-400 border-surface-700 hover:bg-surface-700 hover:text-white'
                          }`}
                        >
                          <RiAlertLine className={review.toxicityScore > 0.5 ? 'text-rose-400' : ''} />
                          {expandedInsights === review._id ? 'Close Telemetry' : 'Analyze Intent'}
                        </button>
                      </div>

                      {review.status === 'pending' && !review.isDeleted && (
                        <div className="flex gap-3">
                          <button
                            id={`reject-btn-${review._id}`}
                            onClick={() => { setRejectModal(review._id); setRejectReason(''); }}
                            disabled={!!actionLoading}
                            className="px-6 py-2 rounded-xl bg-transparent hover:bg-rose-500/10 text-rose-500 text-[10px] font-black transition-all uppercase border border-rose-500/30 hover:border-rose-500/60"
                          >
                            Reject Content
                          </button>
                          <button
                            id={`approve-btn-${review._id}`}
                            onClick={() => handleApprove(review._id)}
                            disabled={!!actionLoading}
                            className="px-8 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black transition-all uppercase shadow-xl shadow-emerald-500/20 border border-emerald-400/30"
                          >
                            {actionLoading === review._id + '-approve' ? '...' : 'Verify Content'}
                          </button>
                        </div>
                      )}
                      
                      {review.isDeleted && (
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                          No actions available (Deleted)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Insights Drawer */}
                  {expandedInsights === review._id && (
                    <div className="px-8 pb-8 animate-slide-down bg-surface-900/30 border-t border-brand-500/10">
                      <AIInsights 
                        toxicityScore={review.toxicityScore}
                        detectedKeywords={review.detectedKeywords}
                        similarity={review.duplicateSimilarity}
                        isDuplicate={review.isDuplicate}
                        matchedText={review.duplicateOf?.reviewText}
                        matchedProduct={review.duplicateOf?.productName}
                        currentText={review.reviewText}
                      />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-center gap-4 py-12">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-12 h-12 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-brand-500 disabled:opacity-20 transition-all shadow-xl">
                    <RiArrowRightSLine className="rotate-180 text-xl" />
                  </button>
                  <div className="bg-surface-800 px-6 py-3 rounded-2xl border border-surface-700 text-slate-400 text-xs font-black shadow-xl">
                    <span className="text-white">{page}</span> / {pages}
                  </div>
                  <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="w-12 h-12 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-brand-500 disabled:opacity-20 transition-all shadow-xl">
                    <RiArrowRightSLine className="text-xl" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Audit Log Overlay */}
      <div 
        className={`fixed inset-y-0 right-0 w-[400px] bg-surface-800/95 backdrop-blur-xl border-l border-surface-700 shadow-[20px_0_60px_rgba(0,0,0,0.5)] z-[60] p-8 transition-all duration-500 transform ${
          showLogs ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-xl font-black text-white flex items-center gap-3">
            <RiFileListLine className="text-brand-500" />
            Decision History
          </h3>
          <button onClick={() => setShowLogs(false)} className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <RiCloseLine size={24} />
          </button>
        </div>
        
        {auditLogs.length === 0 ? (
          <div className="text-center py-32">
            <RiFileListLine className="text-5xl text-slate-700 mx-auto mb-6 opacity-20" />
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">No Recent Decisions Tracked</p>
          </div>
        ) : (
          <div className="space-y-5">
            {auditLogs.map((log) => (
              <div key={log._id} className="group p-5 rounded-2xl bg-surface-900/50 border border-surface-700 hover:border-brand-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    log.action === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {log.action}
                  </span>
                  <span className="text-[9px] text-slate-600 font-black uppercase">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-slate-200 font-bold mb-2 truncate">{log.reviewId?.productName || 'System Product'}</p>
                {log.reason && (
                  <p className="text-[11px] text-slate-500 italic mt-3 border-t border-surface-700 pt-3 line-clamp-2 leading-relaxed">
                    "{log.reason}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal - REDESIGNED FIXED OVERLAY */}
      {rejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-surface-800 w-full max-w-lg rounded-[40px] border border-surface-700 shadow-[0_0_100px_rgba(0,0,0,0.8)] p-10 animate-scale-up relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]"></div>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 rounded-[24px] bg-rose-500/20 flex items-center justify-center shrink-0">
                <RiAlertLine className="text-rose-500 text-3xl" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Reject Review</h3>
                <p className="text-slate-400 font-medium mt-1">Please clarify the reason for this decision.</p>
              </div>
            </div>
            
            <div className="mb-8">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Rejection Reason <span className="text-rose-500">*</span></label>
              <textarea
                id="reject-reason-textarea"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Describe the violation (e.g., Profanity, Spam, Irrelevant content...)"
                rows={5}
                autoFocus
                className="w-full bg-surface-900 border border-surface-700 rounded-3xl p-5 text-white text-sm font-medium focus:border-rose-500 focus:shadow-[0_0_20px_rgba(244,63,94,0.1)] outline-none resize-none transition-all placeholder:text-slate-700"
              />
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => { setRejectModal(null); setRejectReason(''); }} 
                className="flex-1 px-8 py-4 rounded-2xl bg-surface-700 text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-surface-600 transition-all border border-surface-600"
              >
                Go Back
              </button>
              <button
                id="confirm-rejection-submit"
                onClick={handleReject}
                disabled={!!actionLoading}
                className="flex-1 px-8 py-4 rounded-2xl bg-rose-600 text-white text-xs font-black uppercase tracking-widest shadow-2xl shadow-rose-500/30 hover:bg-rose-500 transition-all border border-rose-400/30"
              >
                {actionLoading ? 'Updating System...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
