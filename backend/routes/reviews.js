const express = require('express');
const { body } = require('express-validator');
const { submitReview, getMyReviews, updateReview, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { reviewSubmitLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post(
  '/',
  protect,
  reviewSubmitLimiter,
  [
    body('productName')
      .trim()
      .notEmpty()
      .withMessage('Product name is required')
      .isLength({ max: 100 })
      .withMessage('Product name cannot exceed 100 characters'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be a whole number between 1 and 5'),
    body('reviewText')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Review text must be between 10 and 2000 characters')
  ],
  submitReview
);

router.get('/my', protect, getMyReviews);

router.put(
  '/:id',
  protect,
  [
    body('productName').trim().notEmpty().isLength({ max: 100 }),
    body('rating').isInt({ min: 1, max: 5 }),
    body('reviewText').trim().isLength({ min: 10, max: 2000 })
  ],
  updateReview
);

router.delete('/:id', protect, deleteReview);

module.exports = router;
