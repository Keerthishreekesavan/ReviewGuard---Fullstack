import React from 'react';

const HighlightedText = ({ text, keywords }) => {
  if (!keywords || keywords.length === 0) return <span>{text}</span>;

  // Create a regex to match any of the keywords (case insensitive)
  const escapedKeywords = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escapedKeywords.join('|')})\\b`, 'gi');
  
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) => {
        // Robust case-insensitive check
        const isMatch = keywords.some(k => 
          k && part && k.toLowerCase().trim() === part.toLowerCase().trim()
        );
        
        return isMatch ? (
          <mark key={i} className="bg-rose-500/20 text-rose-400 font-bold px-1 py-0.5 rounded border border-rose-500/30">
            {part}
          </mark>
        ) : (
          part
        );
      })}
    </span>
  );
};

export default HighlightedText;
