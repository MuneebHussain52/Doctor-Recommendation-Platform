// Test file for phone number validation
// Run with: node test_phone_validation.js

// Copy of the validatePhone function from Register.tsx
const validatePhone = (phone) => {
  // Empty check
  if (!phone) return 'Phone number is required';
  
  // Check for only digits
  if (!/^\d+$/.test(phone)) {
    return 'Phone number must contain only digits (0-9)';
  }
  
  // Check length
  if (phone.length < 10) return 'Phone number must be at least 10 digits';
  if (phone.length > 15) return 'Phone number must not exceed 15 digits';
  
  return null;
}

// Test cases
const testCases = [
  // Valid inputs
  { input: "1234567890", expected: null, description: "Valid: 10 digits" },
  { input: "12345678901", expected: null, description: "Valid: 11 digits" },
  { input: "123456789012", expected: null, description: "Valid: 12 digits" },
  { input: "1234567890123", expected: null, description: "Valid: 13 digits" },
  { input: "12345678901234", expected: null, description: "Valid: 14 digits" },
  { input: "123456789012345", expected: null, description: "Valid: 15 digits (maximum)" },
  { input: "9876543210", expected: null, description: "Valid: Different 10 digits" },
  { input: "0000000000", expected: null, description: "Valid: All zeros" },
  { input: "9999999999", expected: null, description: "Valid: All nines" },
  
  // Invalid inputs - too short
  { input: "123456789", expected: 'Phone number must be at least 10 digits', description: "Invalid: 9 digits (too short)" },
  { input: "12345", expected: 'Phone number must be at least 10 digits', description: "Invalid: 5 digits (too short)" },
  { input: "1", expected: 'Phone number must be at least 10 digits', description: "Invalid: 1 digit (too short)" },
  
  // Invalid inputs - too long
  { input: "1234567890123456", expected: 'Phone number must not exceed 15 digits', description: "Invalid: 16 digits (too long)" },
  { input: "12345678901234567890", expected: 'Phone number must not exceed 15 digits', description: "Invalid: 20 digits (too long)" },
  
  // Invalid inputs - contains spaces
  { input: "123 456 7890", expected: 'Phone number must contain only digits (0-9)', description: "Invalid: Contains spaces" },
  { input: "1234567890 ", expected: 'Phone number must contain only digits (0-9)', description: "Invalid: Trailing space" },
  { input: " 1234567890", expected: 'Phone number must contain only digits (0-9)', description: "Invalid: Leading space" },
  
  // Invalid inputs - contains letters
  { input: "12345abcde", expected: 'Phone number must contain only digits (0-9)', description: "Invalid: Contains letters" },
  { input: "abcdefghij", expected: 'Phone number must contain only digits (0-9)', description: "Invalid: Only letters" },
  { input: "123ABC7890", expected: 'Phone number must contain only digits (0-9)', description: "Invalid: Mixed letters" },
  
  // Invalid inputs - contains special characters
  { input: "+1234567890", expected: 'Phone number must contain only digits (0-9)', description: "Invalid: Contains + sign" },
  { input: "(123)456-7890", expected: 'Phone number must contain only digits (0-9)', description: "Invalid: Contains () and -" },
  { input: "123-456-7890", expected: 'Phone number must contain only digits (0-9)', description: "Invalid: Contains hyphens" },
  { input: "123.456.7890", expected: 'Phone number must contain only digits (0-9)', description: "Invalid: Contains periods" },
  { input: "123@456#7890", expected: 'Phone number must contain only digits (0-9)', description: "Invalid: Contains @ and #" },
  { input: "1234567890!", expected: 'Phone number must contain only digits (0-9)', description: "Invalid: Contains !" },
  
  // Invalid inputs - empty
  { input: "", expected: 'Phone number is required', description: "Invalid: Empty string" },
  { input: null, expected: 'Phone number is required', description: "Invalid: null" },
  { input: undefined, expected: 'Phone number is required', description: "Invalid: undefined" },
];

// Run tests
console.log('Running phone number validation tests...\n');
let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = validatePhone(test.input);
  const success = result === test.expected;
  
  if (success) {
    passed++;
    console.log(`✓ Test ${index + 1}: ${test.description}`);
  } else {
    failed++;
    console.log(`✗ Test ${index + 1}: ${test.description}`);
    console.log(`  Input: "${test.input}"`);
    console.log(`  Expected: ${test.expected}`);
    console.log(`  Got: ${result}`);
  }
});

console.log(`\n${passed}/${testCases.length} tests passed`);
if (failed > 0) {
  console.log(`${failed} tests failed`);
  process.exit(1);
} else {
  console.log('All tests passed! ✓');
}
