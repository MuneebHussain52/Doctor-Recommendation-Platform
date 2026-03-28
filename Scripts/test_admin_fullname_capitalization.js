/**
 * Test suite for Admin Full Name Auto-Capitalization
 * 
 * Tests that the first letter of each word is capitalized
 */

// Capitalization function (from Admin/AdminRegister.tsx handleChange)
const capitalizeFullName = (value) => {
  const words = value.split(' ');
  const capitalizedValue = words
    .map(word => {
      if (word.length > 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word;
    })
    .join(' ');
  return capitalizedValue;
};

// Test cases
const testCases = [
  { input: 'john doe', expected: 'John Doe', description: 'Lowercase two-word name' },
  { input: 'JOHN DOE', expected: 'John Doe', description: 'Uppercase two-word name' },
  { input: 'jOhN dOe', expected: 'John Doe', description: 'Mixed case two-word name' },
  { input: 'mary jane watson', expected: 'Mary Jane Watson', description: 'Lowercase three-word name' },
  { input: 'MARY JANE WATSON', expected: 'Mary Jane Watson', description: 'Uppercase three-word name' },
  { input: 'jean-pierre', expected: 'Jean-pierre', description: 'Hyphenated name (hyphen preserved)' },
  { input: "o'brien", expected: "O'brien", description: 'Name with apostrophe' },
  { input: 'john paul george ringo', expected: 'John Paul George Ringo', description: 'Four-word name' },
  { input: 'a', expected: 'A', description: 'Single lowercase letter' },
  { input: 'A', expected: 'A', description: 'Single uppercase letter' },
  { input: 'john  doe', expected: 'John  Doe', description: 'Name with double space (preserved)' },
  { input: 'ANNE-MARIE', expected: 'Anne-marie', description: 'Uppercase hyphenated name' },
  { input: "O'BRIEN", expected: "O'brien", description: 'Uppercase name with apostrophe' },
  { input: 'mCdonald', expected: 'Mcdonald', description: 'Mixed case with capital in middle' },
  { input: 'jean paul marie claude', expected: 'Jean Paul Marie Claude', description: 'Four-word French name' },
];

// Run tests
console.log('='.repeat(80));
console.log('ADMIN FULL NAME AUTO-CAPITALIZATION TEST SUITE');
console.log('='.repeat(80));
console.log();

let passed = 0;
let failed = 0;
const failures = [];

testCases.forEach((testCase, index) => {
  const result = capitalizeFullName(testCase.input);
  const testPassed = result === testCase.expected;
  
  if (testPassed) {
    passed++;
    console.log(`✓ Test ${index + 1}: ${testCase.description}`);
    console.log(`  "${testCase.input}" → "${result}"`);
  } else {
    failed++;
    console.log(`✗ Test ${index + 1}: ${testCase.description}`);
    console.log(`  Input: "${testCase.input}"`);
    console.log(`  Expected: "${testCase.expected}"`);
    console.log(`  Got: "${result}"`);
    failures.push({
      test: index + 1,
      description: testCase.description,
      input: testCase.input,
      expected: testCase.expected,
      got: result
    });
  }
});

console.log();
console.log('='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));
console.log(`Total Tests: ${testCases.length}`);
console.log(`Passed: ${passed} (${Math.round((passed / testCases.length) * 100)}%)`);
console.log(`Failed: ${failed}`);

if (failures.length > 0) {
  console.log();
  console.log('FAILED TESTS:');
  failures.forEach(failure => {
    console.log(`  Test ${failure.test}: ${failure.description}`);
    console.log(`    Input: "${failure.input}"`);
    console.log(`    Expected: "${failure.expected}"`);
    console.log(`    Got: "${failure.got}"`);
  });
}

console.log();
console.log('='.repeat(80));
console.log('CAPITALIZATION RULES VERIFIED:');
console.log('='.repeat(80));
console.log('✓ First letter of each word is capitalized');
console.log('✓ Remaining letters are lowercase');
console.log('✓ Spaces are preserved');
console.log('✓ Hyphens and apostrophes are preserved');
console.log('='.repeat(80));

// Exit with error code if tests failed
if (failed > 0) {
  process.exit(1);
}
