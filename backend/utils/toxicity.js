/**
 * Mock AI Toxicity Detector
 * Uses keyword lists + pattern matching to classify review toxicity.
 * Returns a score (0.0 - 1.0) and detected flag categories.
 */

const TOXIC_CATEGORIES = {
  profanity: {
    words: ['damn', 'hell', 'crap', 'ass', 'bastard', 'bitch', 'fuck', 'shit', 'piss', 'dick', 'cock', 'pussy', 'whore', 'slut', 'jerk', 'dumbass', 'f*ck', 'sh*t', 'b*tch'],
    severity: 0.35
  },
  hate_speech: {
    words: ['racist', 'sexist', 'bigot', 'nazi', 'fascist', 'idiot', 'moron', 'retard', 'loser', 'worthless', 'disgusting', 'garbage', 'trash', 'scum', 'scam', 'fake', 'worthless'],
    severity: 0.65
  },
  threats: {
    words: ['kill', 'murder', 'destroy', 'attack', 'hurt', 'harm', 'beat', 'punch', 'shoot', 'bomb', 'stab', 'threaten', 'eliminate', 'kll', 'destory', 'slaughter'],
    severity: 0.9
  },
  spam: {
    words: ['buy now', 'click here', 'free money', 'earn cash', 'discount code', 'promo code', 'visit our site', 'check this link', 'make money fast', 'limited offer'],
    severity: 0.45
  },
  personal_attack: {
    words: ['you are stupid', 'you are dumb', 'you suck', 'terrible person', 'absolute idiot', 'stupid', 'dumb', 'idiot', 'stupd', 'terrible'],
    severity: 0.55
  }
};

function detectToxicity(text) {
  if (!text || typeof text !== 'string') {
    return { score: 0, flags: [], isToxic: false };
  }

  const flags = [];
  const detectedKeywords = [];
  let maxBaseSeverity = 0;

  for (const [category, config] of Object.entries(TOXIC_CATEGORIES)) {
    for (const word of config.words) {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // 1. Whole Word Match (Standard)
      const exactRegex = new RegExp(`\\b${escapedWord}\\b`, 'i');
      
      // 2. Fragment Match (Fuzzy Root Detection)
      // Only for high-priority roots like idiot, fuck, kill
      const isRootWord = ['idiot', 'stupid', 'kill', 'fuck', 'shit', 'scam', 'garbage'].includes(word.toLowerCase());
      
      // If it's a root word, we want to match it even if it's inside another word (fuzziness)
      // but for highlighting, we want the WHOLE word containing it.
      const detectorRegex = isRootWord ? new RegExp(escapedWord, 'i') : exactRegex;

      if (detectorRegex.test(text)) {
        if (!flags.includes(category)) {
          flags.push(category);
          maxBaseSeverity = Math.max(maxBaseSeverity, config.severity);
        }
        
        // Find the FULL word that contains the match
        const fullWordRegex = new RegExp(`\\b\\w*${escapedWord}\\w*\\b`, 'i');
        const match = text.match(fullWordRegex);
        const actualWord = match ? match[0] : word;

        if (!detectedKeywords.includes(actualWord)) {
          detectedKeywords.push(actualWord);
        }
      }
    }
  }

  // Calculate Scaled Score (Score Stacking)
  // Each unique keyword found adds a 10% bonus to the base severity
  let finalScore = maxBaseSeverity;
  if (detectedKeywords.length > 1) {
    const bonus = (detectedKeywords.length - 1) * 0.10;
    finalScore += bonus;
  }


  // Excessive exclamation marks
  const exclCount = (text.match(/!/g) || []).length;
  if (exclCount > 4) {
    finalScore += 0.10;
    if (!flags.includes('excessive_punctuation')) flags.push('excessive_punctuation');
  }

  const score = Math.round(Math.min(finalScore, 1.0) * 100) / 100;

  return {
    score,
    flags,
    detectedKeywords,
    isToxic: score > 0.3
  };
}

module.exports = { detectToxicity };
