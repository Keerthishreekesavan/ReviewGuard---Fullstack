const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 100
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5
    },
    reviewText: {
      type: String,
      required: [true, 'Review text is required'],
      minlength: 10,
      maxlength: 2000
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    // Async AI processing state
    aiStatus: {
      type: String,
      enum: ['processing', 'complete', 'failed'],
      default: 'processing'
    },
    // AI Toxicity Analysis
    toxicityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    toxicityFlags: [
      {
        type: String
      }
    ],
    // Duplicate Detection
    isDuplicate: {
      type: Boolean,
      default: false
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
      default: null
    },
    duplicateSimilarity: {
      type: Number,
      default: 0
    },
    // OpenAI embedding vector for semantic duplicate detection.
    // select: false — never returned in API responses (too large, internal use only).
    embeddingVector: {
      type: [Number],
      default: [],
      select: false
    },
    // Moderation Info
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    moderatedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    },
    // Explainable AI
    detectedKeywords: [
      {
        type: String
      }
    ],
    // Deletion Support
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    // Review Lifecycle Timeline
    timeline: [
      {
        status: {
          type: String,
          required: true
        },
        message: {
          type: String
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

// Index for faster queries
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ productName: 1 });

module.exports = mongoose.model('Review', reviewSchema);
