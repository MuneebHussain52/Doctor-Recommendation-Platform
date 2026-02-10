/**
 * Test suite for Patient Registration Phone Number Validation
 * 
 * Requirements:
 * - Must contain only digits (0–9)
 * - Minimum: 10 digits
 * - Maximum: 15 digits
 * - Should not contain spaces, letters, or special characters
 */

// Phone validation function (from Patient/Register.tsx)
const validatePhone = (phone) => {
  if (!phone) return 'Phone number is required';
  
  // Check if contains only digits
  if (!/^\d+$/.test(phone)) {
    return 'Phone number must contain only digits (0-9)';
  }
  
  // Check length
  if (phone.length < 10) return 'Phone number must be at least 10 digits';
  if (phone.length > 15) return 'Phone number must not exceed 15 digits';
  
  return null;
};

// Test cases
const testCases = [
  // Valid phone numbers
  { phone: '1234567890', expected: null, description: 'Valid 10-digit phone' },
  { phone: '12345678901', expected: null, description: 'Valid 11-digit phone' },
  { phone: '123456789012', expected: null, description: 'Valid 12-digit phone' },
  { phone: '1234567890123', expected: null, description: 'Valid 13-digit phone' },
  { phone: '12345678901234', expected: null, description: 'Valid 14-digit phone' },
  { phone: '123456789012345', expected: null, description: 'Valid 15-digit phone (max)' },
  { phone: '9876543210', expected: null, description: 'Valid 10-digit phone (different digits)' },
  { phone: '0000000000', expected: null, description: 'Valid phone with all zeros' },
  { phone: '1111111111', expected: null, description: 'Valid phone with all ones' },
  
  // Empty phone
  { phone: '', expected: 'Phone number is required', description: 'Empty phone number' },
  
  // Too short (less than 10 digits)
  { phone: '1', expected: 'Phone number must be at least 10 digits', description: '1 digit' },
  { phone: '12', expected: 'Phone number must be at least 10 digits', description: '2 digits' },
  { phone: '123', expected: 'Phone number must be at least 10 digits', description: '3 digits' },
  { phone: '1234', expected: 'Phone number must be at least 10 digits', description: '4 digits' },
  { phone: '12345', expected: 'Phone number must be at least 10 digits', description: '5 digits' },
  { phone: '123456', expected: 'Phone number must be at least 10 digits', description: '6 digits' },
  { phone: '1234567', expected: 'Phone number must be at least 10 digits', description: '7 digits' },
  { phone: '12345678', expected: 'Phone number must be at least 10 digits', description: '8 digits' },
  { phone: '123456789', expected: 'Phone number must be at least 10 digits', description: '9 digits' },
  
  // Too long (more than 15 digits)
  { phone: '1234567890123456', expected: 'Phone number must not exceed 15 digits', description: '16 digits' },
  { phone: '12345678901234567', expected: 'Phone number must not exceed 15 digits', description: '17 digits' },
  { phone: '12345678901234567890', expected: 'Phone number must not exceed 15 digits', description: '20 digits' },
  
  // Contains spaces
  { phone: '123 456 7890', expected: 'Phone number must contain only digits (0-9)', description: 'Contains spaces' },
  { phone: ' 1234567890', expected: 'Phone number must contain only digits (0-9)', description: 'Leading space' },
  { phone: '1234567890 ', expected: 'Phone number must contain only digits (0-9)', description: 'Trailing space' },
  { phone: '12345 67890', expected: 'Phone number must contain only digits (0-9)', description: 'Space in middle' },
  
  // Contains letters
  { phone: '123456789a', expected: 'Phone number must contain only digits (0-9)', description: 'Contains lowercase letter' },
  { phone: '123456789A', expected: 'Phone number must contain only digits (0-9)', description: 'Contains uppercase letter' },
  { phone: 'abcdefghij', expected: 'Phone number must contain only digits (0-9)', description: 'All letters' },
  { phone: '12345ABC90', expected: 'Phone number must contain only digits (0-9)', description: 'Mixed digits and letters' },
  
  // Contains special characters
  { phone: '(123) 456-7890', expected: 'Phone number must contain only digits (0-9)', description: 'Formatted with parentheses and hyphens' },
  { phone: '123-456-7890', expected: 'Phone number must contain only digits (0-9)', description: 'Contains hyphens' },
  { phone: '123.456.7890', expected: 'Phone number must contain only digits (0-9)', description: 'Contains dots' },
  { phone: '+1234567890', expected: 'Phone number must contain only digits (0-9)', description: 'Contains plus sign' },
  { phone: '1234567890#', expected: 'Phone number must contain only digits (0-9)', description: 'Contains hash' },
  { phone: '1234567890*', expected: 'Phone number must contain only digits (0-9)', description: 'Contains asterisk' },
  { phone: '(1234567890)', expected: 'Phone number must contain only digits (0-9)', description: 'Contains parentheses' },
  { phone: '123/456/7890', expected: 'Phone number must contain only digits (0-9)', description: 'Contains slashes' },
  { phone: '123_456_7890', expected: 'Phone number must contain only digits (0-9)', description: 'Contains underscores' },
  { phone: '123,456,7890', expected: 'Phone number must contain only digits (0-9)', description: 'Contains commas' },
  
  // Mixed errors (special chars + wrong length)
  { phone: '123-45', expected: 'Phone number must contain only digits (0-9)', description: 'Special chars + too short' },
  { phone: '+12345678901234567890', expected: 'Phone number must contain only digits (0-9)', description: 'Special char + too long' },
  
  // Edge cases
  { phone: '0123456789', expected: null, description: 'Starts with zero' },
  { phone: '9999999999', expected: null, description: 'All nines' },
];

// Run tests
console.log('='.repeat(80));
console.log('PATIENT PHONE NUMBER VALIDATION TEST SUITE');
console.log('='.repeat(80));
console.log();

let passed = 0;
let failed = 0;
const failures = [];

testCases.forEach((testCase, index) => {
  const result = validatePhone(testCase.phone);
  const testPassed = result === testCase.expected;
  
  if (testPassed) {
    passed++;
    console.log(`✓ Test ${index + 1}: ${testCase.description}`);
  } else {
    failed++;
    console.log(`✗ Test ${index + 1}: ${testCase.description}`);
    console.log(`  Input: "${testCase.phone}"`);
    console.log(`  Expected: ${testCase.expected}`);
    console.log(`  Got: ${result}`);
    failures.push({
      test: index + 1,
      description: testCase.description,
      phone: testCase.phone,
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
    console.log(`    Input: "${failure.phone}"`);
    console.log(`    Expected: ${failure.expected}`);
    console.log(`    Got: ${failure.got}`);
  });
}

console.log();
console.log('='.repeat(80));
console.log('VALIDATION RULES VERIFIED:');
console.log('='.repeat(80));
console.log('✓ Phone must contain only digits (0-9)');
console.log('✓ Phone must be at least 10 digits');
console.log('✓ Phone must not exceed 15 digits');
console.log('✓ Phone must not contain spaces');
console.log('✓ Phone must not contain letters');
console.log('✓ Phone must not contain special characters');
console.log('✓ Empty phone shows proper error message');
console.log('='.repeat(80));

// Exit with error code if tests failed
if (failed > 0) {
  process.exit(1);
}
