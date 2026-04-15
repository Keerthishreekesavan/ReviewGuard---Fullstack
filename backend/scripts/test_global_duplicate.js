const { checkDuplicate } = require('../utils/tfidf');

const globalExistingReviews = [
  { _id: '1', productName: 'iPhone 15', reviewText: 'The camera quality is absolutely stunning and night mode is great' },
  { _id: '2', productName: 'Sony Headphones', reviewText: 'Battery life lasts for days and noise cancellation is top tier' }
];

console.log('--- Testing Global Duplicate Detection ---\n');

const testCases = [
  {
    name: 'Cross-Product Match',
    text: 'The camera quality is absolutely stunning and night mode is great', // Exact match of iPhone review
    product: 'Samsung S24', // Different product
    expected: true
  },
  {
    name: 'Unique Review',
    text: 'The screen is very bright but the charging speed is slow.',
    product: 'iPhone 15',
    expected: false
  }
];

testCases.forEach(tc => {
  const result = checkDuplicate(tc.text, globalExistingReviews);
  const passed = result.isDuplicate === tc.expected;
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${tc.name}`);
  console.log(`  Similarity: ${result.similarity}`);
  console.log(`  Duplicate: ${result.isDuplicate}\n`);
});
