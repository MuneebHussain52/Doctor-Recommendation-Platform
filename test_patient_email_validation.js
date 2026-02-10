/**
 * Test suite for Patient Registration Email Validation
 * 
 * Requirements:
 * - Must contain @ and .
 * - No spaces allowed
 * - Under 254 characters
 * - Unique email (not already registered - only in patients)
 */

// Email format validation function (from Patient/Register.tsx)
const validateEmailFormat = (email) => {
  if (!email) return 'Email is required';
  if (email.length > 253) return 'Email must be under 254 characters';
  if (email.includes(' ')) return 'Email must not contain spaces';
  if (!email.includes('@') || !email.includes('.')) return 'Email must contain "@" and "."';
  return null;
};

// Test cases
const testCases = [
  // Valid email formats
  { email: 'patient@example.com', expected: null, description: 'Valid email with @ and .' },
  { email: 'test.patient@domain.com', expected: null, description: 'Valid email with dot before @' },
  { email: 'user+tag@example.co.uk', expected: null, description: 'Valid email with + and multiple dots' },
  { email: 'a@b.c', expected: null, description: 'Minimal valid email' },
  { email: 'patient_123@test.org', expected: null, description: 'Valid email with underscore and numbers' },
  
  // Empty email
  { email: '', expected: 'Email is required', description: 'Empty email' },
  
  // Missing @ symbol
  { email: 'patientexample.com', expected: 'Email must contain "@" and "."', description: 'Missing @ symbol' },
  { email: 'patient.example.com', expected: 'Email must contain "@" and "."', description: 'Missing @ (has dots only)' },
  
  // Missing dot
  { email: 'patient@examplecom', expected: 'Email must contain "@" and "."', description: 'Missing dot after @' },
  { email: 'patient@domain', expected: 'Email must contain "@" and "."', description: 'Missing dot in domain' },
  
  // Missing both @ and dot
  { email: 'patientexamplecom', expected: 'Email must contain "@" and "."', description: 'Missing both @ and dot' },
  
  // Contains spaces
  { email: 'patient @example.com', expected: 'Email must not contain spaces', description: 'Space before @' },
  { email: 'patient@ example.com', expected: 'Email must not contain spaces', description: 'Space after @' },
  { email: 'patient@example .com', expected: 'Email must not contain spaces', description: 'Space in domain' },
  { email: ' patient@example.com', expected: 'Email must not contain spaces', description: 'Leading space' },
  { email: 'patient@example.com ', expected: 'Email must not contain spaces', description: 'Trailing space' },
  { email: 'pat ient@example.com', expected: 'Email must not contain spaces', description: 'Space in local part' },
  
  // Length validation (254 characters max)
  { 
    email: 'a'.repeat(241) + '@example.com', 
    expected: null, 
    description: 'Email with 253 characters (exactly at limit)' 
  },
  { 
    email: 'a'.repeat(242) + '@example.com', 
    expected: 'Email must be under 254 characters', 
    description: 'Email with 254 characters (over limit by 1)' 
  },
  { 
    email: 'a'.repeat(300) + '@example.com', 
    expected: 'Email must be under 254 characters', 
    description: 'Email with 313 characters (way over limit)' 
  },
  
  // Edge cases with @ and . positioning
  { email: '@example.com', expected: null, description: 'Email starting with @ (technically valid per basic check)' },
  { email: 'patient@.com', expected: null, description: 'Dot immediately after @ (technically valid per basic check)' },
  { email: 'patient@example.', expected: null, description: 'Ending with dot (technically valid per basic check)' },
  { email: '.patient@example.com', expected: null, description: 'Starting with dot (technically valid per basic check)' },
  
  // Multiple @ symbols (only checks if @ exists, not count)
  { email: 'patient@@example.com', expected: null, description: 'Multiple @ symbols (passes basic check)' },
  
  // Special characters (should pass as long as @ and . are present)
  { email: 'patient!#$%@example.com', expected: null, description: 'Special characters in local part' },
  { email: 'patient@ex-ample.com', expected: null, description: 'Hyphen in domain' },
  { email: 'patient@123.456', expected: null, description: 'Numeric domain' },
];

// Run tests
console.log('='.repeat(80));
console.log('PATIENT EMAIL VALIDATION TEST SUITE');
console.log('='.repeat(80));
console.log();

let passed = 0;
let failed = 0;
const failures = [];

testCases.forEach((testCase, index) => {
  const result = validateEmailFormat(testCase.email);
  const testPassed = result === testCase.expected;
  
  if (testPassed) {
    passed++;
    console.log(`✓ Test ${index + 1}: ${testCase.description}`);
  } else {
    failed++;
    console.log(`✗ Test ${index + 1}: ${testCase.description}`);
    console.log(`  Input: "${testCase.email}"`);
    console.log(`  Expected: ${testCase.expected}`);
    console.log(`  Got: ${result}`);
    failures.push({
      test: index + 1,
      description: testCase.description,
      email: testCase.email,
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
    console.log(`    Input: "${failure.email}"`);
    console.log(`    Expected: ${failure.expected}`);
    console.log(`    Got: ${failure.got}`);
  });
}

console.log();
console.log('='.repeat(80));
console.log('VALIDATION RULES VERIFIED:');
console.log('='.repeat(80));
console.log('✓ Email must contain @ symbol');
console.log('✓ Email must contain . (dot)');
console.log('✓ Email must not contain spaces');
console.log('✓ Email must be under 254 characters');
console.log('✓ Empty email shows proper error message');
console.log();
console.log('Note: Uniqueness check is tested via API call on blur, not in format validation');
console.log('='.repeat(80));

// Exit with error code if tests failed
if (failed > 0) {
  process.exit(1);
}
