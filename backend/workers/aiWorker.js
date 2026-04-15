/**
 * AI Review Worker
 * Runs in the same process as the Express server (so it can share the io instance).
 * Processes: toxicity analysis via OpenAI GPT-4o-mini (with rule-based fallback).
 * On completion: updates the Review document and emits Socket.io event to the user.
 */
const { Worker } = require('bullmq');
const Review = require('../models/Review');
const { detectToxicityAI } = require('../utils/aiToxicity');
const { connection } = require('../queues/aiQueue');

/**
 * Start the background worker. Called from server.js with the io instance.
 * @param {import('socket.io').Server} io
 */
function startAIWorker(io) {
  const worker = new Worker(
    'ai-review-analysis',

    async (job) => {
      const { reviewId, reviewText } = job.data;
      console.log(`[Worker] 🔄 Processing job ${job.id} for review ${reviewId}`);

      // --- Run semantic toxicity analysis ---
      const toxicityResult = await detectToxicityAI(reviewText);

      // --- Update review in DB ---
      const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        {
          toxicityScore:    toxicityResult.score,
          toxicityFlags:    toxicityResult.flags,
          detectedKeywords: toxicityResult.detectedKeywords,
          aiStatus:         'complete'
        },
        { new: true }
      ).populate('userId', '_id name');

      if (!updatedReview) {
        throw new Error(`Review ${reviewId} not found in DB — skipping socket emit`);
      }

      const userId = updatedReview.userId._id.toString();

      // --- Emit ai-complete event to the user's Socket.io room ---
      io.to(`user:${userId}`).emit('review:ai-complete', {
        reviewId:         updatedReview._id,
        aiStatus:         'complete',
        toxicityScore:    toxicityResult.score,
        toxicityFlags:    toxicityResult.flags,
        detectedKeywords: toxicityResult.detectedKeywords,
        isToxic:          toxicityResult.isToxic
      });

      // --- Additional toast notification if flagged as toxic ---
      if (toxicityResult.isToxic) {
        io.to(`user:${userId}`).emit('review:ai-flagged', {
          reviewId:    updatedReview._id,
          productName: updatedReview.productName,
          flags:       toxicityResult.flags,
          keywords:    toxicityResult.detectedKeywords,
          message:     `⚠️ AI flagged your review for "${updatedReview.productName}": ${toxicityResult.flags.join(', ')}`
        });
      }

      console.log(`[Worker] ✅ Job ${job.id} complete — score=${toxicityResult.score}, toxic=${toxicityResult.isToxic}`);
      return { reviewId, score: toxicityResult.score };
    },

    {
      connection,
      concurrency: 3  // Process up to 3 reviews simultaneously
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} finished`);
  });

  worker.on('failed', async (job, err) => {
    console.error(`[Worker] ❌ Job ${job?.id} failed after all retries:`, err.message);
    // Mark the review as AI-failed so the UI can show a fallback state
    if (job?.data?.reviewId) {
      await Review.findByIdAndUpdate(job.data.reviewId, { aiStatus: 'failed' }).catch(() => {});
    }
  });

  console.log('[Worker] 🚀 AI Review Worker started (concurrency: 3)');
  return worker;
}

module.exports = { startAIWorker };
