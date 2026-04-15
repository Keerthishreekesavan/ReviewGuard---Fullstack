/**
 * Singleton OpenAI client.
 * All AI utilities import from here so there's only one instance.
 */
const { OpenAI } = require('openai');

if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
  console.warn('[OpenAI] ⚠️  No API key configured. All AI features will use rule-based fallback.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'missing',
  timeout: 20000,   // 20s timeout per request
  maxRetries: 2     // Auto-retry on network errors
});

module.exports = openai;
