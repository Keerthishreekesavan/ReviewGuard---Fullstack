const Review = require('../models/Review');
const AuditLog = require('../models/AuditLog');

const getAllReviews = async (req, res) => {
  try {
    const { status, isDuplicate, isToxic, page = 1, limit = 20, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      if (status === 'deleted') {
        query.status = 'pending';
        query.isDeleted = true;
      } else if (status === 'pending') {
        query.status = 'pending';
        query.isDeleted = { $ne: true };
      } else {
        query.status = status;
      }
    }
    if (isToxic === 'true') {
      const minScore = parseFloat(req.query.minToxicity) || 0;
      query.toxicityScore = { $gte: minScore };
    } else {
      // Default behavior if not explicitly filtering for toxic content: 
      // Don't apply toxicityScore filter
    }

    if (isDuplicate === 'true') {
      query.isDuplicate = true;
      const minSim = parseFloat(req.query.minSimilarity) || 0;
      query.duplicateSimilarity = { $gte: minSim };
    }

    if (req.query.userId) query.userId = req.query.userId;

    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { reviewText: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Review.countDocuments(query);

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .populate('moderatedBy', 'name')
      .populate('duplicateOf', 'productName reviewText');

    res.json({
      reviews,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found.' });
    if (review.status !== 'pending') {
      return res.status(400).json({ message: `Review is already ${review.status}.` });
    }

    review.status = 'approved';
    review.moderatedBy = req.user._id;
    review.moderatedAt = new Date();
    
    // Add to timeline
    review.timeline.push({
      status: 'Approved',
      message: 'Review approved by moderator.',
      performedBy: req.user._id,
      timestamp: new Date()
    });

    await review.save();

    // Audit log
    await AuditLog.create({
      moderatorId: req.user._id,
      reviewId: review._id,
      action: 'approved'
    });

    // Real-time notification to user
    const io = req.app.get('io');
    io.to(`user:${review.userId.toString()}`).emit('review:status-updated', {
      reviewId: review._id,
      status: 'approved',
      productName: review.productName,
      message: `Your review for "${review.productName}" has been approved! 🎉`
    });

    const populatedReview = await Review.findById(review._id)
      .populate('userId', 'name email')
      .populate('moderatedBy', 'name');

    res.json({ message: 'Review approved successfully.', review: populatedReview });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectReview = async (req, res) => {
  try {
    const { reason } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found.' });
    if (review.status !== 'pending') {
      return res.status(400).json({ message: `Review is already ${review.status}.` });
    }

    review.status = 'rejected';
    review.moderatedBy = req.user._id;
    review.moderatedAt = new Date();
    review.rejectionReason = reason || 'Did not meet community guidelines.';

    // Add to timeline
    review.timeline.push({
      status: 'Rejected',
      message: `Review rejected: ${review.rejectionReason}`,
      performedBy: req.user._id,
      timestamp: new Date()
    });

    await review.save();

    // Audit log
    await AuditLog.create({
      moderatorId: req.user._id,
      reviewId: review._id,
      action: 'rejected',
      reason: review.rejectionReason
    });

    // Real-time notification
    const io = req.app.get('io');
    io.to(`user:${review.userId.toString()}`).emit('review:status-updated', {
      reviewId: review._id,
      status: 'rejected',
      productName: review.productName,
      message: `Your review for "${review.productName}" was rejected. Reason: ${review.rejectionReason}`
    });

    const populatedReview = await Review.findById(review._id)
      .populate('userId', 'name email')
      .populate('moderatedBy', 'name');

    res.json({ message: 'Review rejected.', review: populatedReview });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const isModerator = req.user.role === 'moderator';

    // Global counts (needed by both for context)
    const [total, approved, rejected, pending, toxic, duplicates] = await Promise.all([
      Review.countDocuments(),
      Review.countDocuments({ status: 'approved' }),
      Review.countDocuments({ status: 'rejected' }),
      Review.countDocuments({ status: 'pending' }),
      Review.countDocuments({ toxicityScore: { $gt: 0.3 } }),
      Review.countDocuments({ isDuplicate: true })
    ]);

    let roleSpecificData = {};

    if (isModerator) {
      // Personal Metrics for Moderator
      const personalActions = await AuditLog.aggregate([
        { $match: { moderatorId: req.user._id } },
        { $group: { _id: '$action', count: { $sum: 1 } } }
      ]);

      const myStats = {
        approved: personalActions.find(a => a._id === 'approved')?.count || 0,
        rejected: personalActions.find(a => a._id === 'rejected')?.count || 0
      };
      
      roleSpecificData = {
        personal: {
          totalHandled: myStats.approved + myStats.rejected,
          ...myStats,
          impact: total > 0 ? Math.round(((myStats.approved + myStats.rejected) / (approved + rejected || 1)) * 100) : 0
        }
      };
    } else {
      // Team Benchmarking for Admin
      const staffPerformance = await AuditLog.aggregate([
        {
          $group: {
            _id: '$moderatorId',
            totalActions: { $sum: 1 },
            approvals: { $sum: { $cond: [{ $eq: ['$action', 'approved'] }, 1, 0] } },
            rejections: { $sum: { $cond: [{ $eq: ['$action', 'rejected'] }, 1, 0] } }
          }
        },
        { $sort: { totalActions: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'moderator'
          }
        },
        { $unwind: '$moderator' },
        {
          $project: {
            name: '$moderator.name',
            totalActions: 1,
            approvals: 1,
            rejections: 1,
            _id: 0
          }
        }
      ]);

      roleSpecificData = { staffPerformance };
    }

    // Common Charts
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const reviewsPerDay = await Review.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const topProducts = await Review.aggregate([
      { $group: { _id: '$productName', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { name: '$_id', count: 1, avgRating: { $round: ['$avgRating', 1] }, _id: 0 } }
    ]);

    const avgToxicityResult = await Review.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$toxicityScore' } } }
    ]);

    const ratingDist = await Review.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { rating: '$_id', count: 1, _id: 0 } }
    ]);

    res.json({
      stats: {
        total,
        approved,
        rejected,
        pending,
        toxic,
        duplicates,
        approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
        avgToxicity: Math.round((avgToxicityResult[0]?.avgScore || 0) * 100) / 100
      },
      charts: {
        reviewsPerDay,
        reviewsByStatus: [
          { name: 'Approved', value: approved },
          { name: 'Rejected', value: rejected },
          { name: 'Pending', value: pending }
        ],
        topProducts,
        ratingDist
      },
      ...roleSpecificData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, moderatorId, action, reviewId } = req.query;
    const query = {};

    const mongoose = require('mongoose');
    if (req.user.role === 'moderator') {
      query.moderatorId = req.user._id;
    } else if (req.user.role === 'admin' && moderatorId) {
      if (mongoose.Types.ObjectId.isValid(moderatorId)) {
        query.moderatorId = moderatorId;
      } else {
        // If invalid ID provided by admin, return empty results or ignore
        return res.json({ logs: [], total: 0, page: parseInt(page), pages: 0 });
      }
    }

    if (action) query.action = action;
    if (reviewId) query.reviewId = reviewId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await AuditLog.countDocuments(query);

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('moderatorId', 'name email')
      .populate('reviewId', 'productName reviewText status isDeleted');

    res.json({
      logs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllReviews, approveReview, rejectReview, getAnalytics, getAuditLogs };
