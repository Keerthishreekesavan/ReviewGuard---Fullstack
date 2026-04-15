import React from 'react';
import { 
  RiAlertLine, RiInformationLine,
  RiShieldFlashLine, RiStickyNoteLine 
} from 'react-icons/ri';

const AIInsights = ({ toxicityScore, detectedKeywords, similarity, isDuplicate, matchedText, matchedProduct, currentText }) => {

  const getScoreColor = (score) => {
    if (score > 0.7) return 'text-rose-500';
    if (score > 0.4) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const highlightOverlap = (text) => {
    if (!matchedText || !currentText) return text;
    const currentWords = new Set(currentText.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words = text.split(/(\s+)/);
    
    return words.map((word, i) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanWord && currentWords.has(cleanWord)) {
        return <mark key={i} className="bg-amber-500/30 text-amber-200 px-0.5 rounded">{word}</mark>;
      }
      return word;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Toxicity Column */}
        <div className="bg-surface-800/50 p-5 rounded-2xl border border-surface-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <RiShieldFlashLine className="text-rose-400" />
              Toxicity Engine
            </h4>
            <span className={`text-sm font-black ${getScoreColor(toxicityScore)}`}>
              {(toxicityScore * 100).toFixed(0)}%
            </span>
          </div>
          
          <div className="w-full bg-surface-700 rounded-full h-1.5 mb-4 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${toxicityScore > 0.5 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-emerald-500'}`} 
              style={{ width: `${toxicityScore * 100}%` }}
            />
          </div>
          
          {detectedKeywords && detectedKeywords.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter block">Heuristic Flags:</span>
              <div className="flex flex-wrap gap-1.5">
                {detectedKeywords.map((word, i) => (
                  <span key={i} className="px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-md text-[10px] border border-rose-500/20 font-bold uppercase">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Duplicate Column */}
        <div className="bg-surface-800/50 p-5 rounded-2xl border border-surface-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <RiStickyNoteLine className="text-amber-400" />
              Similarity Match
            </h4>
            <span className={`text-sm font-black ${isDuplicate ? 'text-amber-400' : 'text-emerald-500'}`}>
              {(similarity * 100).toFixed(0)}%
            </span>
          </div>
          
          <div className="w-full bg-surface-700 rounded-full h-1.5 mb-4 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${isDuplicate ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'bg-emerald-500'}`} 
              style={{ width: `${similarity * 100}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            {isDuplicate 
              ? "Matches an existing review record with high probability." 
              : "Content appears largely unique within the global catalog."}
          </p>
        </div>
      </div>

      {/* Detailed Match View (Only if Duplicate) */}
      {isDuplicate && matchedText && (
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5 animate-slide-up">
          <h5 className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
            <RiAlertLine />
            Comparative Breakdown (Top Match)
          </h5>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                 <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-tighter">Matched Product:</p>
                 <p className="text-xs text-slate-300 font-black">{matchedProduct || 'Unknown System Record'}</p>
              </div>
            </div>

            <div className="text-sm text-slate-300 leading-relaxed">
              {highlightOverlap(matchedText)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
