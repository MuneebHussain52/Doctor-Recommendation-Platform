// Test file for custom specialty auto-capitalization
// This tests the handleChange functionality that auto-capitalizes each word
// Run with: node test_custom_specialty_capitalization.js

// Copy of the capitalization logic from handleChange in Register.tsx
const capitalizeCustomSpecialty = (value) => {
  return value
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Test cases
const testCases = [
  { input: "heart surgeon", expected: "Heart Surgeon", description: "Capitalize: heart surgeon" },
  { input: "HEART SURGEON", expected: "Heart Surgeon", description: "Normalize: HEART SURGEON" },
  { input: "HeArT SuRgEoN", expected: "Heart Surgeon", description: "Normalize: HeArT SuRgEoN" },
  { input: "internal medicine", expected: "Internal Medicine", description: "Capitalize: internal medicine" },
  { input: "pediatric cardiology", expected: "Pediatric Cardiology", description: "Capitalize: pediatric cardiology" },
  { input: "a b c", expected: "A B C", description: "Capitalize: single letters" },
  { input: "test", expected: "Test", description: "Capitalize: single word" },
  { input: "test test test", expected: "Test Test Test", description: "Capitalize: repeated words" },
  { input: "heart  surgeon", expected: "Heart  Surgeon", description: "Preserve double spaces" },
];

// Run tests
console.log('Running custom specialty capitalization tests...\n');
let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = capitalizeCustomSpecialty(test.input);
  const success = result === test.expected;
  
  if (success) {
    passed++;
    console.log(`✓ Test ${index + 1}: ${test.description}`);
    console.log(`  "${test.input}" → "${result}"`);
  } else {
    failed++;
    console.log(`✗ Test ${index + 1}: ${test.description}`);
    console.log(`  Input: "${test.input}"`);
    console.log(`  Expected: "${test.expected}"`);
    console.log(`  Got: "${result}"`);
  }
});

console.log(`\n${passed}/${testCases.length} tests passed`);
if (failed > 0) {
  console.log(`${failed} tests failed`);
  process.exit(1);
} else {
  console.log('All tests passed! ✓');
}
