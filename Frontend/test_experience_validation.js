// Test file for years of experience validation
// Run with: node test_experience_validation.js

// Copy of the validateExperience function from Register.tsx
const validateExperience = (experience) => {
  // Empty check
  if (!experience && experience !== '0') return 'Years of experience is required';
  
  // Check if it's a valid number
  const num = Number(experience);
  if (isNaN(num)) return 'Years of experience must be a valid number';
  
  // Check for decimals
  if (!Number.isInteger(num)) return 'Years of experience must be a whole number (no decimals)';
  
  // Check for negative numbers
  if (num < 0) return 'Years of experience cannot be negative';
  
  // Check minimum and maximum
  if (num < 0) return 'Years of experience must be at least 0';
  if (num > 50) return 'Years of experience cannot exceed 50';
  
  return null;
}

// Test cases
const testCases = [
  // Valid inputs - within range
  { input: "0", expected: null, description: "Valid: Minimum value (0)" },
  { input: "1", expected: null, description: "Valid: 1 year" },
  { input: "5", expected: null, description: "Valid: 5 years" },
  { input: "10", expected: null, description: "Valid: 10 years" },
  { input: "20", expected: null, description: "Valid: 20 years" },
  { input: "25", expected: null, description: "Valid: 25 years" },
  { input: "30", expected: null, description: "Valid: 30 years" },
  { input: "40", expected: null, description: "Valid: 40 years" },
  { input: "49", expected: null, description: "Valid: 49 years" },
  { input: "50", expected: null, description: "Valid: Maximum value (50)" },
  
  // Invalid inputs - too high
  { input: "51", expected: 'Years of experience cannot exceed 50', description: "Invalid: 51 (exceeds maximum)" },
  { input: "100", expected: 'Years of experience cannot exceed 50', description: "Invalid: 100 (exceeds maximum)" },
  { input: "999", expected: 'Years of experience cannot exceed 50', description: "Invalid: 999 (exceeds maximum)" },
  
  // Invalid inputs - negative numbers
  { input: "-1", expected: 'Years of experience cannot be negative', description: "Invalid: -1 (negative)" },
  { input: "-5", expected: 'Years of experience cannot be negative', description: "Invalid: -5 (negative)" },
  { input: "-10", expected: 'Years of experience cannot be negative', description: "Invalid: -10 (negative)" },
  { input: "-100", expected: 'Years of experience cannot be negative', description: "Invalid: -100 (negative)" },
  
  // Invalid inputs - decimals
  { input: "2.5", expected: 'Years of experience must be a whole number (no decimals)', description: "Invalid: 2.5 (decimal)" },
  { input: "5.5", expected: 'Years of experience must be a whole number (no decimals)', description: "Invalid: 5.5 (decimal)" },
  { input: "10.1", expected: 'Years of experience must be a whole number (no decimals)', description: "Invalid: 10.1 (decimal)" },
  { input: "0.5", expected: 'Years of experience must be a whole number (no decimals)', description: "Invalid: 0.5 (decimal)" },
  { input: "1.99", expected: 'Years of experience must be a whole number (no decimals)', description: "Invalid: 1.99 (decimal)" },
  { input: "20.0001", expected: 'Years of experience must be a whole number (no decimals)', description: "Invalid: 20.0001 (decimal)" },
  
  // Invalid inputs - negative decimals
  { input: "-2.5", expected: 'Years of experience must be a whole number (no decimals)', description: "Invalid: -2.5 (negative decimal)" },
  { input: "-5.5", expected: 'Years of experience must be a whole number (no decimals)', description: "Invalid: -5.5 (negative decimal)" },
  
  // Invalid inputs - not a number
  { input: "abc", expected: 'Years of experience must be a valid number', description: "Invalid: 'abc' (not a number)" },
  { input: "5years", expected: 'Years of experience must be a valid number', description: "Invalid: '5years' (contains letters)" },
  { input: "five", expected: 'Years of experience must be a valid number', description: "Invalid: 'five' (text)" },
  { input: "10a", expected: 'Years of experience must be a valid number', description: "Invalid: '10a' (number with letter)" },
  { input: "a10", expected: 'Years of experience must be a valid number', description: "Invalid: 'a10' (letter with number)" },
  
  // Invalid inputs - special characters
  { input: "10!", expected: 'Years of experience must be a valid number', description: "Invalid: '10!' (contains !)" },
  { input: "@10", expected: 'Years of experience must be a valid number', description: "Invalid: '@10' (contains @)" },
  { input: "10#", expected: 'Years of experience must be a valid number', description: "Invalid: '10#' (contains #)" },
  
  // Invalid inputs - empty
  { input: "", expected: 'Years of experience is required', description: "Invalid: Empty string" },
  { input: null, expected: 'Years of experience is required', description: "Invalid: null" },
  { input: undefined, expected: 'Years of experience is required', description: "Invalid: undefined" },
  
  // Edge cases - whitespace (will be converted to number)
  { input: " 5 ", expected: null, description: "Valid: '5' with spaces (trimmed by Number())" },
  { input: "  10  ", expected: null, description: "Valid: '10' with spaces (trimmed by Number())" },
  
  // Edge cases - zero variations
  { input: "00", expected: null, description: "Valid: '00' (equals 0)" },
  { input: "000", expected: null, description: "Valid: '000' (equals 0)" },
];

// Run tests
console.log('Running years of experience validation tests...\n');
let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = validateExperience(test.input);
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
