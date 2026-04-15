const express = require('express');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const {
  getAllReviews,
  approveReview,
  rejectReview,
  getAnalytics,
  getAuditLogs
} = require('../controllers/moderationController');

const router = express.Router();

// All moderation routes require auth + moderator or admin role
router.use(protect, requireRole('moderator', 'admin'));

router.get('/reviews', getAllReviews);
router.put('/reviews/:id/approve', approveReview);
router.put('/reviews/:id/reject', rejectReview);
router.get('/analytics', getAnalytics);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
