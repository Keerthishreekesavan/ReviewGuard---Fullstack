const rateLimit = require('express-rate-limit');

// General API rate limiter: relaxed for development (originally 100)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: { message: 'Too many requests from this IP. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict limiter for review submission: 1000 per hour (originally 10)
const reviewSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  message: { message: 'Review submission limit reached. You can submit up to 1000 reviews per hour.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth limiter: 500 attempts per 15 minutes (originally 20)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { apiLimiter, reviewSubmitLimiter, authLimiter };
