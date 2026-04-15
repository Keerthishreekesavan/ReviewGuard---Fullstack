/**
 * Semantic Duplicate Detection Engine
 * Primary:  text-embedding-3-small (OpenAI) + cosine similarity
 * Hybrid:   Compares against stored embedding vectors.
 *           Reviews without vectors fall back to TF-IDF.
 * Fallback: TF-IDF + Levenshtein (utils/tfidf.js)
 */
const openai = require('./openaiClient');
const { checkDuplicate: ruleBasedCheck } = require('./tfidf');

const SIMILARITY_THRESHOLD = 0.82; // Embeddings threshold (higher = stricter)
const TFIDF_THRESHOLD = 0.70;      // TF-IDF threshold for legacy reviews

const isOpenAIEnabled = () =>
  process.env.OPENAI_API_KEY &&
  process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' &&
  process.env.AI_PROVIDER !== 'rule-based';

/**
 * Compute an embedding vector for a piece of text.
 * Model: text-embedding-3-small (1536 dims, ~$0.00002/1K tokens)
 */
async function getEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000) // Stay within token limit
  });
  return response.data[0].embedding;
}

/**
 * Fast cosine similarity between two equal-length vectors.
 */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const mag = Math.sqrt(magA) * Math.sqrt(magB);
  return mag === 0 ? 0 : dot / mag;
}

/**
 * Hybrid duplicate check:
 * 1. For reviews that have embeddingVector stored → cosine similarity
 * 2. For reviews without vectors (older data) → rule-based TF-IDF
 * 3. Return whichever finds the highest match
 *
 * @param {string} newText - The new review text
 * @param {Array}  existingReviews - Review docs with reviewText, _id, embeddingVector
 * @returns {{ isDuplicate, duplicateOf, similarity, newEmbedding }}
 */
async function checkDuplicateAI(newText, existingReviews) {
  if (!isOpenAIEnabled()) {
    console.log('[AI Duplicate] Using TF-IDF fallback (no OpenAI key)');
    return { ...ruleBasedCheck(newText, existingReviews), newEmbedding: null };
  }

  if (!existingReviews || existingReviews.length === 0) {
    const newEmbedding = await getEmbedding(newText).catch(() => null);
    return { isDuplicate: false, duplicateOf: null, similarity: 0, newEmbedding };
  }

  try {
    // Get embedding for the new review
    const newEmbedding = await getEmbedding(newText);

    const withVectors    = existingReviews.filter(r => r.embeddingVector && r.embeddingVector.length > 0);
    const withoutVectors = existingReviews.filter(r => !r.embeddingVector || r.embeddingVector.length === 0);

    let highestSimilarity = 0;
    let mostSimilarId = null;

    // --- Embedding-based comparison ---
    for (const review of withVectors) {
      const sim = cosineSimilarity(newEmbedding, review.embeddingVector);
      if (sim > highestSimilarity) {
        highestSimilarity = sim;
        mostSimilarId = review._id;
      }
    }

    // --- TF-IDF fallback for older reviews without vectors ---
    if (withoutVectors.length > 0) {
      const fallback = ruleBasedCheck(newText, withoutVectors, TFIDF_THRESHOLD);
      if (fallback.similarity > highestSimilarity) {
        highestSimilarity = fallback.similarity;
        mostSimilarId = fallback.duplicateOf;
      }
    }

    const roundedSim = Math.round(highestSimilarity * 100) / 100;
    const isDuplicate = highestSimilarity >= SIMILARITY_THRESHOLD;

    console.log(`[AI Duplicate] similarity=${roundedSim}, isDuplicate=${isDuplicate} (${withVectors.length} embedding matches, ${withoutVectors.length} TF-IDF matches)`);

    return {
      isDuplicate,
      duplicateOf: isDuplicate ? mostSimilarId : null,
      similarity: roundedSim,
      newEmbedding  // Return to caller so it can be stored on the review
    };

  } catch (err) {
    console.error('[AI Duplicate] OpenAI error — using TF-IDF fallback:', err.message);
    return { ...ruleBasedCheck(newText, existingReviews), newEmbedding: null };
  }
}

module.exports = { checkDuplicateAI, getEmbedding, cosineSimilarity };
