const { checkDuplicate } = require('../utils/tfidf');

const existingReviews = [
  { _id: '1', reviewText: 'The song headphones are so great' },
  { _id: '2', reviewText: 'This product is absolute garbage' }
];

const testCases = [
  {
    name: 'Exact Match',
    text: 'The song headphones are so great',
    expected: true
  },
  {
    name: 'Near Match (Typo)',
    text: 'The sony headphones are great', // song -> sony, removed 'so'
    expected: true
  },
  {
    name: 'Different Review',
    text: 'These headphones are really comfortable and sound good',
    expected: false
  },
  {
    name: 'Small Case/Punctuation Difference',
    text: 'THE SONG HEADPHONES ARE SO GREAT!!!',
    expected: true
  }
];

console.log('--- Testing Hybrid Duplicate Detection ---\n');

testCases.forEach(tc => {
  const result = checkDuplicate(tc.text, existingReviews);
  const passed = result.isDuplicate === tc.expected;
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${tc.name}`);
  console.log(`  Text: "${tc.text}"`);
  console.log(`  Similarity Score: ${result.similarity}`);
  console.log(`  Detected as Duplicate: ${result.isDuplicate}\n`);
});
