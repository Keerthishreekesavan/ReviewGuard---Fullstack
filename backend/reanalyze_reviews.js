const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Review = require('./models/Review');
const { detectToxicity } = require('./utils/toxicity');

dotenv.config();

const reanalyze = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to MongoDB.');

    const reviews = await Review.find({});
    console.log(`Found ${reviews.length} reviews. Starting re-analysis...`);

    let updatedCount = 0;

    for (const review of reviews) {
      const results = detectToxicity(review.reviewText);
      
      // Update the review with new AI analysis
      review.toxicityScore = results.score;
      review.toxicityFlags = results.flags;
      review.detectedKeywords = results.detectedKeywords;
      
      // Also update isToxic if threshold is met
      review.isToxic = results.isToxic;

      await review.save();
      updatedCount++;
      
      if (updatedCount % 5 === 0) {
        console.log(`Progress: ${updatedCount}/${reviews.length} reviews processed...`);
      }
    }

    console.log(`\nCOMPLETED! Updated ${updatedCount} reviews with High-Intelligence moderation logic.`);
    process.exit(0);
  } catch (error) {
    console.error('Error during re-analysis:', error);
    process.exit(1);
  }
};

reanalyze();
