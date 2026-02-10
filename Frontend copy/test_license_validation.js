// Test file for license number validation
// Run with: node test_license_validation.js

// Copy of the validateLicense function from Register.tsx
const validateLicense = (license) => {
  // Empty check
  if (!license) return 'License number is required';
  
  // Check for valid characters (alphanumeric, hyphens, and slashes only)
  if (!/^[A-Za-z0-9\-\/]+$/.test(license)) {
    return 'License number must contain only letters, numbers, hyphens, or slashes';
  }
  
  return null;
}

// Test cases
const testCases = [
  // Valid inputs - alphanumeric only
  { input: "MED123456", expected: null, description: "Valid: Letters and numbers" },
  { input: "ABC123", expected: null, description: "Valid: Mix of letters and numbers" },
  { input: "123456", expected: null, description: "Valid: Only numbers" },
  { input: "ABCDEF", expected: null, description: "Valid: Only uppercase letters" },
  { input: "abcdef", expected: null, description: "Valid: Only lowercase letters" },
  { input: "AbCdEf123", expected: null, description: "Valid: Mixed case with numbers" },
  
  // Valid inputs - with hyphens
  { input: "MED-123456", expected: null, description: "Valid: With hyphen" },
  { input: "ABC-123-XYZ", expected: null, description: "Valid: Multiple hyphens" },
  { input: "MED-2024-ABC", expected: null, description: "Valid: Hyphens separating sections" },
  { input: "123-456-789", expected: null, description: "Valid: Numbers with hyphens" },
  { input: "-ABC123", expected: null, description: "Valid: Starting with hyphen" },
  { input: "ABC123-", expected: null, description: "Valid: Ending with hyphen" },
  
  // Valid inputs - with slashes
  { input: "MED/123456", expected: null, description: "Valid: With slash" },
  { input: "ABC/123/XYZ", expected: null, description: "Valid: Multiple slashes" },
  { input: "MED/2024/ABC", expected: null, description: "Valid: Slashes separating sections" },
  { input: "123/456/789", expected: null, description: "Valid: Numbers with slashes" },
  { input: "/ABC123", expected: null, description: "Valid: Starting with slash" },
  { input: "ABC123/", expected: null, description: "Valid: Ending with slash" },
  
  // Valid inputs - mixed hyphens and slashes
  { input: "MED-123/456", expected: null, description: "Valid: Hyphen and slash" },
  { input: "ABC/123-XYZ", expected: null, description: "Valid: Slash and hyphen mixed" },
  { input: "A1-B2/C3", expected: null, description: "Valid: Complex mix" },
  
  // Invalid inputs - spaces
  { input: "MED 123456", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains space" },
  { input: "MED 123 456", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Multiple spaces" },
  { input: " MED123456", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Leading space" },
  { input: "MED123456 ", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Trailing space" },
  
  // Invalid inputs - special characters
  { input: "MED@123456", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains @" },
  { input: "MED#123456", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains #" },
  { input: "MED$123456", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains $" },
  { input: "MED%123456", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains %" },
  { input: "MED&123456", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains &" },
  { input: "MED*123456", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains *" },
  { input: "MED+123456", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains +" },
  { input: "MED=123456", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains =" },
  { input: "MED.123456", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains period" },
  { input: "MED,123456", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains comma" },
  { input: "MED:123456", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains colon" },
  { input: "MED;123456", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains semicolon" },
  { input: "MED!123456", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains !" },
  { input: "MED?123456", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains ?" },
  { input: "MED(123456)", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains parentheses" },
  { input: "MED[123456]", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains brackets" },
  { input: "MED{123456}", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains braces" },
  { input: "MED<123456>", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains < >" },
  { input: "MED_123456", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains underscore" },
  { input: "MED|123456", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains pipe" },
  { input: "MED\\123456", expected: 'License number must contain only letters, numbers, hyphens, or slashes', description: "Invalid: Contains backslash" },
  
  // Invalid inputs - empty
  { input: "", expected: 'License number is required', description: "Invalid: Empty string" },
  { input: null, expected: 'License number is required', description: "Invalid: null" },
  { input: undefined, expected: 'License number is required', description: "Invalid: undefined" },
];

// Run tests
console.log('Running license number validation tests...\n');
let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = validateLicense(test.input);
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
