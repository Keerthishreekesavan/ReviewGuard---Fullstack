require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Review = require('../models/Review');
const AuditLog = require('../models/AuditLog');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected for seeding...');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  await connectDB();

  console.log('\n🌱 Clearing existing data...');
  await User.deleteMany({});
  await Review.deleteMany({});
  await AuditLog.deleteMany({});

  console.log('👤 Creating users...');
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@reviewmod.com',
    password: 'Admin@123',
    role: 'admin'
  });

  const moderator = await User.create({
    name: 'Jane Moderator',
    email: 'moderator@reviewmod.com',
    password: 'Mod@1234',
    role: 'moderator'
  });

  const user = await User.create({
    name: 'John Doe',
    email: 'user@reviewmod.com',
    password: 'User@1234',
    role: 'user'
  });

  const user2 = await User.create({
    name: 'Alice Smith',
    email: 'alice@reviewmod.com',
    password: 'Alice@1234',
    role: 'user'
  });

  console.log('📝 Creating sample reviews...');

  const review1 = await Review.create({
    userId: user._id,
    productName: 'MacBook Pro M3',
    rating: 5,
    reviewText:
      'This laptop is absolutely incredible! The performance is blazing fast and the battery lasts all day. Perfect for developers and creative professionals alike. Highly recommended!',
    status: 'approved',
    toxicityScore: 0,
    toxicityFlags: [],
    isDuplicate: false,
    moderatedBy: moderator._id,
    moderatedAt: new Date()
  });

  const review2 = await Review.create({
    userId: user._id,
    productName: 'iPhone 15 Pro',
    rating: 4,
    reviewText:
      'Great phone with an excellent camera system. The titanium build feels premium and the action button is very useful. Battery life could be better but overall very satisfied.',
    status: 'approved',
    toxicityScore: 0,
    toxicityFlags: [],
    isDuplicate: false,
    moderatedBy: moderator._id,
    moderatedAt: new Date()
  });

  const review3 = await Review.create({
    userId: user._id,
    productName: 'Samsung 4K TV',
    rating: 2,
    reviewText:
      'This product is absolute garbage! I hate this stupid TV and want to destroy it. Total scam by a terrible company. Kill this product line!',
    status: 'pending',
    toxicityScore: 0.9,
    toxicityFlags: ['threats', 'hate_speech', 'profanity'],
    isDuplicate: false
  });

  const review4 = await Review.create({
    userId: user2._id,
    productName: 'MacBook Pro M3',
    rating: 5,
    reviewText:
      'This laptop is absolutely incredible! The performance is blazing fast and the battery lasts all day. Perfect for developers and creative professionals. Highly recommended!',
    status: 'pending',
    toxicityScore: 0,
    toxicityFlags: [],
    isDuplicate: true,
    duplicateOf: review1._id,
    duplicateSimilarity: 0.92
  });

  const review5 = await Review.create({
    userId: user2._id,
    productName: 'Sony WH-1000XM5',
    rating: 5,
    reviewText:
      'Best noise-cancelling headphones I have ever used. The sound quality is amazing and they are very comfortable for long sessions. Worth every penny!',
    status: 'pending',
    toxicityScore: 0,
    toxicityFlags: [],
    isDuplicate: false
  });

  const review6 = await Review.create({
    userId: user._id,
    productName: 'Dell XPS 15',
    rating: 3,
    reviewText:
      'Decent laptop but runs very hot under load. The display is gorgeous but thermal management is disappointing. Customer support was helpful when I had issues.',
    status: 'rejected',
    toxicityScore: 0,
    toxicityFlags: [],
    isDuplicate: false,
    moderatedBy: moderator._id,
    moderatedAt: new Date(),
    rejectionReason: 'Review lacks sufficient detail for our platform guidelines.'
  });

  console.log('📋 Creating audit logs...');
  await AuditLog.create([
    { moderatorId: moderator._id, reviewId: review1._id, action: 'approved' },
    { moderatorId: moderator._id, reviewId: review2._id, action: 'approved' },
    {
      moderatorId: moderator._id,
      reviewId: review6._id,
      action: 'rejected',
      reason: 'Review lacks sufficient detail for our platform guidelines.'
    }
  ]);

  console.log('\n' + '='.repeat(55));
  console.log('✅  SEED COMPLETE — TEST CREDENTIALS');
  console.log('='.repeat(55));
  console.log('👑  Admin');
  console.log('    Email:    admin@reviewmod.com');
  console.log('    Password: Admin@123');
  console.log('');
  console.log('🛡️   Moderator');
  console.log('    Email:    moderator@reviewmod.com');
  console.log('    Password: Mod@1234');
  console.log('');
  console.log('👤  User (John Doe)');
  console.log('    Email:    user@reviewmod.com');
  console.log('    Password: User@1234');
  console.log('');
  console.log('👤  User (Alice Smith)');
  console.log('    Email:    alice@reviewmod.com');
  console.log('    Password: Alice@1234');
  console.log('='.repeat(55));
  console.log(`\n📊 Created: ${await Review.countDocuments()} reviews, ${await User.countDocuments()} users, ${await AuditLog.countDocuments()} audit logs\n`);

  mongoose.disconnect();
};

seedData().catch((err) => {
  console.error(err);
  mongoose.disconnect();
  process.exit(1);
});
