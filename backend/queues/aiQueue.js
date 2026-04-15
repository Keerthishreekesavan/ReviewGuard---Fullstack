/**
 * BullMQ Queue Definition
 * Queue: 'ai-review-analysis' — processes toxicity analysis asynchronously.
 */
const { Queue } = require('bullmq');

// Support both structured config and single REDIS_URL (Upstash/Render style)
const connection = process.env.REDIS_URL ? {
  url: process.env.REDIS_URL,
  maxRetriesPerRequest: null,
} : {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null
};

const aiReviewQueue = new Queue('ai-review-analysis', {
  connection,
  defaultJobOptions: {
    attempts: 5,                                // Increased retries for production
    backoff: { type: 'exponential', delay: 2000 }, 
    removeOnComplete: { count: 100 },
    removeOnFail:    { count: 50 }
  }
});

let _isReady = false;

// Enhanced connection monitoring
aiReviewQueue.waitUntilReady()
  .then(() => {
    _isReady = true;
    console.log('[Queue] ✅ BullMQ connected to Redis');
  })
  .catch((err) => {
    _isReady = false;
    console.warn('[Queue] ⚠️  Redis connection failed:', err.message);
    console.warn('AI moderation will run synchronously until Redis is available.');
  });

// Expose a helper to check connection status
const isQueueReady = () => _isReady;

module.exports = { aiReviewQueue, connection, isQueueReady };
