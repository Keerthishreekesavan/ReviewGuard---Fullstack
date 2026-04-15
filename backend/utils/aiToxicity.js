/**
 * Semantic Toxicity Detection Engine
 * Primary: GPT-4o-mini with structured JSON output
 * Fallback: Rule-based keyword engine (utils/toxicity.js)
 */
const openai = require('./openaiClient');
const { detectToxicity: ruleBasedDetect } = require('./toxicity');

const isOpenAIEnabled = () =>
  process.env.OPENAI_API_KEY &&
  process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' &&
  process.env.AI_PROVIDER !== 'rule-based';

const SYSTEM_PROMPT = `You are a product review content moderation AI.
Analyze the given review for harmful content and return ONLY a valid JSON object.

Respond with this exact structure:
{
  "score": <float 0.0-1.0, where 0.0=completely clean, 1.0=maximally harmful>,
  "flags": <array of applicable categories from: ["profanity", "hate_speech", "threats", "spam", "personal_attack"]>,
  "detectedKeywords": <array of specific concerning words or phrases found; empty array if none>,
  "reasoning": <one concise sentence explanation>
}

Scoring guide:
- Honest product criticism ("terrible quality", "stopped working") = 0.0, not toxic
- Mild profanity = 0.35–0.50
- Personal attacks / hate speech = 0.55–0.80  
- Explicit threats or extreme content = 0.85–1.0
- Promotional spam / fake-sounding paid reviews = 0.45
- isToxic threshold: score > 0.3`;

async function detectToxicityAI(text) {
  // Fallback if OpenAI not configured
  if (!isOpenAIEnabled()) {
    console.log('[AI Toxicity] Using rule-based fallback (no OpenAI key)');
    return ruleBasedDetect(text);
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze this product review:\n\n"${text.slice(0, 1500)}"` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,    // Low temp for consistent, deterministic output
      max_tokens: 250
    });

    const raw = JSON.parse(response.choices[0].message.content);

    // Sanitize and clamp values
    const score = Math.min(1.0, Math.max(0.0, parseFloat(raw.score) || 0));

    const result = {
      score: Math.round(score * 100) / 100,
      flags: Array.isArray(raw.flags) ? raw.flags.filter(f => typeof f === 'string') : [],
      detectedKeywords: Array.isArray(raw.detectedKeywords)
        ? raw.detectedKeywords.filter(k => typeof k === 'string').slice(0, 10)
        : [],
      isToxic: score > 0.3,
      reasoning: raw.reasoning || ''
    };

    console.log(`[AI Toxicity] score=${result.score}, toxic=${result.isToxic}, flags=${result.flags.join(', ') || 'none'}`);
    return result;

  } catch (err) {
    console.error('[AI Toxicity] OpenAI error — using rule-based fallback:', err.message);
    return ruleBasedDetect(text);
  }
}

module.exports = { detectToxicityAI };
