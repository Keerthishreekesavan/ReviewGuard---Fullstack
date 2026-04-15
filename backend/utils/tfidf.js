/**
 * TF-IDF + Cosine Similarity & Levenshtein Distance based duplicate review detector.
 * Compares a new review against existing reviews for the same product.
 */

const STOP_WORDS = new Set([
  'the', 'and', 'is', 'it', 'in', 'at', 'by', 'to', 'a', 'an'
]);

/**
 * Standardizes text by lowercasing and removing non-alphanumeric chars.
 */
function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function tokenize(text) {
  return normalize(text)
    .split(/\s+/)
    .filter(word => word.length > 1 && !STOP_WORDS.has(word));
}

function termFrequency(tokens) {
  const tf = {};
  const total = tokens.length || 1;
  tokens.forEach(token => {
    tf[token] = (tf[token] || 0) + 1;
  });
  Object.keys(tf).forEach(key => {
    tf[key] = tf[key] / total;
  });
  return tf;
}

function cosineSimilarity(vec1, vec2) {
  const keys = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  keys.forEach(key => {
    const v1 = vec1[key] || 0;
    const v2 = vec2[key] || 0;
    dotProduct += v1 * v2;
    mag1 += v1 * v1;
    mag2 += v2 * v2;
  });

  const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * calculates the edit distance between two strings.
 */
function levenshteinDistance(s1, s2) {
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[len1][len2];
}

/**
 * Normalizes Levenshtein distance into a 0-1 similarity score.
 */
function stringSimilarity(s1, s2) {
  const n1 = normalize(s1);
  const n2 = normalize(s2);
  if (n1 === n2) return 1.0;
  if (n1.length === 0 || n2.length === 0) return 0;

  const distance = levenshteinDistance(n1, n2);
  const maxLength = Math.max(n1.length, n2.length);
  return 1 - distance / maxLength;
}

/**
 * Check if a new review is a duplicate of any existing review.
 * @param {string} newText - Text of the new review
 * @param {Array} existingReviews - Array of review documents with reviewText and _id
 * @param {number} threshold - Similarity threshold (0-1), default 0.8
 * @returns {{ isDuplicate: boolean, duplicateOf: ObjectId|null, similarity: number }}
 */
function checkDuplicate(newText, existingReviews, threshold = 0.7) {
  if (!existingReviews || existingReviews.length === 0) {
    return { isDuplicate: false, duplicateOf: null, similarity: 0 };
  }

  const newTokens = tokenize(newText);
  const newTF = termFrequency(newTokens);
  const normalizedNewText = normalize(newText);

  let highestSimilarity = 0;
  let mostSimilarId = null;

  for (const review of existingReviews) {
    // 1. Check Cosine Similarity (Token based)
    const existingTokens = tokenize(review.reviewText);
    const existingTF = termFrequency(existingTokens);
    const cosSim = cosineSimilarity(newTF, existingTF);

    // 2. Check Character Similarity (Fuzzy based)
    const charSim = stringSimilarity(newText, review.reviewText);

    // Take the best match score
    const similarity = Math.max(cosSim, charSim);

    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      mostSimilarId = review._id;
    }
  }

  const roundedSimilarity = Math.round(highestSimilarity * 100) / 100;

  if (highestSimilarity >= threshold) {
    return {
      isDuplicate: true,
      duplicateOf: mostSimilarId,
      similarity: roundedSimilarity
    };
  }

  return { isDuplicate: false, duplicateOf: null, similarity: roundedSimilarity };
}

module.exports = { checkDuplicate };
