// Test file for custom specialty validation
// Run with: node test_custom_specialty_validation.js

// Copy of the validateCustomSpecialty function from Register.tsx
const validateCustomSpecialty = (specialty) => {
  // Empty check
  if (!specialty || !specialty.trim()) {
    return 'Custom specialty is required when "Other" is selected';
  }
  
  const trimmedSpecialty = specialty.trim();
  
  // Check length
  if (trimmedSpecialty.length < 3) return 'Custom specialty must be at least 3 characters';
  if (trimmedSpecialty.length > 50) return 'Custom specialty must not exceed 50 characters';
  
  // Check for valid characters (letters and spaces only)
  if (!/^[A-Za-z\s]+$/.test(trimmedSpecialty)) {
    return 'Custom specialty must contain only letters and spaces';
  }
  
  return null;
}

// Test cases
const testCases = [
  // Valid inputs
  { input: "Heart Surgeon", expected: null, description: "Valid: Heart Surgeon" },
  { input: "Internal Medicine", expected: null, description: "Valid: Internal Medicine" },
  { input: "Pediatric Cardiology", expected: null, description: "Valid: Pediatric Cardiology" },
  { input: "Abc", expected: null, description: "Valid: Minimum 3 characters" },
  { input: "A".repeat(50), expected: null, description: "Valid: Maximum 50 characters" },
  { input: "Heart   Surgeon", expected: null, description: "Valid: Multiple spaces allowed" },
  { input: "  Heart Surgeon  ", expected: null, description: "Valid: Trimmed spaces" },
  
  // Invalid inputs - too short
  { input: "ab", expected: 'Custom specialty must be at least 3 characters', description: "Invalid: Too short (2 chars)" },
  { input: "a", expected: 'Custom specialty must be at least 3 characters', description: "Invalid: Too short (1 char)" },
  
  // Invalid inputs - too long
  { input: "A".repeat(51), expected: 'Custom specialty must not exceed 50 characters', description: "Invalid: Too long (51 chars)" },
  
  // Invalid inputs - numbers
  { input: "Test123", expected: 'Custom specialty must contain only letters and spaces', description: "Invalid: Contains numbers" },
  { input: "123", expected: 'Custom specialty must contain only letters and spaces', description: "Invalid: Only numbers" },
  
  // Invalid inputs - special characters
  { input: "Test@Med", expected: 'Custom specialty must contain only letters and spaces', description: "Invalid: Contains @" },
  { input: "Test-Med", expected: 'Custom specialty must contain only letters and spaces', description: "Invalid: Contains hyphen" },
  { input: "Test's", expected: 'Custom specialty must contain only letters and spaces', description: "Invalid: Contains apostrophe" },
  { input: "Test.Med", expected: 'Custom specialty must contain only letters and spaces', description: "Invalid: Contains period" },
  
  // Invalid inputs - empty
  { input: "", expected: 'Custom specialty is required when "Other" is selected', description: "Invalid: Empty string" },
  { input: "   ", expected: 'Custom specialty is required when "Other" is selected', description: "Invalid: Only spaces" },
];

// Run tests
console.log('Running custom specialty validation tests...\n');
let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = validateCustomSpecialty(test.input);
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
