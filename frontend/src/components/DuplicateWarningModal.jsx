import React from 'react';
import { RiAlertLine, RiCheckLine, RiEditLine, RiInformationLine } from 'react-icons/ri';

const DuplicateWarningModal = ({ isOpen, onClose, data, onEdit, onSubmitAnyway }) => {
  if (!isOpen || !data) return null;

  const { similarity, matchedText, matchedProduct } = data;

  // Simple overlap highlighting: find words from current draft that appear in matchedText
  // (In a real app, you'd use a more sophisticated diffing algorithm)
  const highlightOverlap = (text) => {
    if (!matchedText) return text;
    const matchedWords = new Set(matchedText.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words = text.split(/(\s+)/);
    
    return words.map((word, i) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanWord && matchedWords.has(cleanWord)) {
        return <mark key={i} className="bg-amber-500/30 text-amber-200 px-0.5 rounded">{word}</mark>;
      }
      return word;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="card max-w-2xl w-full bg-surface-800 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600/20 to-transparent p-6 border-b border-surface-700 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <RiAlertLine className="text-3xl text-amber-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Duplicate Content Detected</h2>
            <p className="text-sm text-slate-400">Our AI found a similar review already exists in our platform.</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Similarity Score Card */}
          <div className="flex items-center justify-between p-4 bg-surface-900/50 rounded-2xl border border-surface-700">
            <div className="flex items-center gap-3">
              <RiInformationLine className="text-brand-400" />
              <span className="text-sm font-medium text-slate-300">Similarity Confidence</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-surface-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-1000" 
                  style={{ width: `${similarity * 100}%` }}
                />
              </div>
              <span className="text-lg font-bold text-amber-500">{(similarity * 100).toFixed(0)}%</span>
            </div>
          </div>

          {/* Comparison */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Matched Review Analysis
            </h3>
            
            <div className="relative p-5 rounded-2xl bg-surface-900 border border-surface-700">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-surface-700 text-slate-300 text-[10px] font-bold rounded uppercase">
                  Existing Review
                </span>
                <span className="text-[10px] text-slate-500 tracking-tight">
                  Product: <span className="text-slate-300">{matchedProduct}</span>
                </span>
              </div>

              <div className="text-sm text-slate-300 leading-relaxed">
                {highlightOverlap(matchedText)}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-xs text-amber-200/80 leading-relaxed flex gap-3">
            <RiInformationLine className="text-lg shrink-0 mt-0.5" />
            <p>
              Submitting duplicate content frequently may result in lower trust scores for your account. 
              <strong> You can choose to revise your review once</strong> to make it unique, or submit it as is for moderation.
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
            className="flex-1 px-6 py-3 bg-surface-700 hover:bg-surface-600 text-slate-200 font-bold rounded-xl transition-all border border-surface-600 flex items-center justify-center gap-2"
          >
            <RiCheckLine />
            Submit Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuplicateWarningModal;
