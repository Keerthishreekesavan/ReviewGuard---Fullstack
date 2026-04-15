const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    moderatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
      required: true
    },
    action: {
      type: String,
      enum: ['approved', 'rejected'],
      required: true
    },
    reason: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

auditLogSchema.index({ moderatorId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
