import React from 'react';
import { RiErrorWarningLine, RiCheckLine, RiEditLine, RiInformationLine, RiShieldKeyholeLine } from 'react-icons/ri';

const ToxicityWarningModal = ({ isOpen, onClose, data, text, onEdit, onSubmitAnyway }) => {
  if (!isOpen || !data) return null;

  const { score, flags = [], detectedKeywords = [] } = data;

  const highlightOverlap = (content) => {
    if (!detectedKeywords || detectedKeywords.length === 0) return content;
    
    // Create a Set for robust lowercase matching
    const keywordSet = new Set(detectedKeywords.map(k => k.toLowerCase()));
    const words = content.split(/(\s+)/);
    
    return words.map((word, i) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanWord && keywordSet.has(cleanWord)) {
        return <mark key={i} className="bg-rose-500/30 text-rose-200 px-0.5 rounded">{word}</mark>;
      }
      return word;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="card max-w-2xl w-full bg-surface-800 border border-rose-500/30 rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600/20 to-transparent p-6 border-b border-surface-700 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center shrink-0">
            <RiErrorWarningLine className="text-3xl text-rose-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Community Guidelines Warning</h2>
            <p className="text-sm text-slate-400">Our AI detected content that may violate our policies.</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Severity Score Card */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex items-center justify-between p-4 bg-surface-900/50 rounded-2xl border border-surface-700">
              <div className="flex items-center gap-3">
                <RiShieldKeyholeLine className="text-brand-400" />
                <span className="text-sm font-medium text-slate-300">Toxicity Score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-surface-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 transition-all duration-1000" 
                    style={{ width: `${Math.min(100, score * 100)}%` }}
                  />
                </div>
                <span className="text-lg font-bold text-rose-500">{(score * 100).toFixed(0)}</span>
              </div>
            </div>

            {/* Flags */}
            <div className="flex-1 flex flex-col justify-center p-4 bg-surface-900/50 rounded-2xl border border-surface-700">
              <span className="text-xs text-slate-400 mb-2">Detected Flags:</span>
              <div className="flex flex-wrap gap-2">
                {flags.length > 0 ? flags.map((flag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold rounded uppercase">
                    {flag.replace('_', ' ')}
                  </span>
                )) : (
                  <span className="text-sm text-slate-500">None</span>
                )}
              </div>
            </div>
          </div>

          {/* Text Analysis */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Review Analysis
            </h3>
            
            <div className="relative p-5 rounded-2xl bg-surface-900 border border-surface-700">
              <div className="text-sm text-slate-300 leading-relaxed">
                {highlightOverlap(text)}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-xs text-rose-200/80 leading-relaxed flex gap-3">
            <RiInformationLine className="text-lg shrink-0 mt-0.5" />
            <p>
              Reviews containing toxic or harmful language may be rejected or affect your account standing. 
              <strong> You can revise your review</strong> to align with our community guidelines, or submit it as is for manual moderation.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-surface-900 border-t border-surface-700 flex gap-4">
          <button
            onClick={onEdit}
            className="flex-1 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2"
          >
            <RiEditLine />
            I want to Revise
          </button>
          <button
            onClick={onSubmitAnyway}
            className="flex-1 px-6 py-3 bg-surface-700 hover:bg-surface-600 text-slate-200 font-bold rounded-xl transition-all border border-surface-600 flex items-center justify-center gap-2 hover:text-rose-400 hover:border-rose-500/50"
          >
            <RiCheckLine />
            Submit Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToxicityWarningModal;
