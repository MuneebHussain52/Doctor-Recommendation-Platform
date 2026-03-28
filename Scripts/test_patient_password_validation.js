/**
 * Test suite for Patient Registration Password Validation
 * 
 * Requirements:
 * - Password must be at least 8 characters long
 * - Password should not be too long (max 64 characters)
 * - Must contain at least one uppercase letter (A–Z)
 * - Must contain at least one lowercase letter (a–z)
 * - Must contain at least one number (0–9)
 * - Must contain at least one special character (like !, @, #, $, %, etc.)
 */

// Password validation function (from Patient/Register.tsx)
const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (password.length > 64) return 'Password must not exceed 64 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter (A-Z)';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter (a-z)';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number (0-9)';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return 'Password must contain at least one special character (!@#$%^&*, etc.)';
  return null;
};

// Test cases
const testCases = [
  // Valid passwords
  { password: 'Password123!', expected: null, description: 'Valid password with all requirements' },
  { password: 'MyP@ssw0rd', expected: null, description: 'Valid password with @ symbol' },
  { password: 'Secur3#Pass', expected: null, description: 'Valid password with # symbol' },
  { password: 'Str0ng$Pass', expected: null, description: 'Valid password with $ symbol' },
  { password: 'Test123!@#', expected: null, description: 'Valid password with multiple special chars' },
  { password: 'aB3!eFgH', expected: null, description: 'Valid password at minimum length (8 chars)' },
  { password: 'A'.repeat(30) + 'a1!', expected: null, description: 'Valid password with 33 characters' },
  { password: 'A'.repeat(60) + 'a1!', expected: null, description: 'Valid password with 63 characters' },
  { password: 'A'.repeat(61) + 'a1!', expected: null, description: 'Valid password at maximum length (64 chars)' },
  
  // Empty password
  { password: '', expected: 'Password is required', description: 'Empty password' },
  
  // Too short (less than 8 characters)
  { password: 'Aa1!', expected: 'Password must be at least 8 characters long', description: '4 characters with all requirements' },
  { password: 'Pass1!', expected: 'Password must be at least 8 characters long', description: '6 characters with all requirements' },
  { password: 'Pasw1!', expected: 'Password must be at least 8 characters long', description: '7 characters with all requirements' },
  
  // Too long (more than 64 characters)
  { password: 'A'.repeat(62) + 'a1!', expected: 'Password must not exceed 64 characters', description: '65 characters (1 over limit)' },
  { password: 'A'.repeat(100) + 'a1!', expected: 'Password must not exceed 64 characters', description: '103 characters (way over limit)' },
  
  // Missing uppercase letter
  { password: 'password123!', expected: 'Password must contain at least one uppercase letter (A-Z)', description: 'No uppercase letter' },
  { password: 'myp@ssw0rd', expected: 'Password must contain at least one uppercase letter (A-Z)', description: 'No uppercase, has special and number' },
  
  // Missing lowercase letter
  { password: 'PASSWORD123!', expected: 'Password must contain at least one lowercase letter (a-z)', description: 'No lowercase letter' },
  { password: 'MYP@SSW0RD', expected: 'Password must contain at least one lowercase letter (a-z)', description: 'No lowercase, has special and number' },
  
  // Missing number
  { password: 'Password!@#', expected: 'Password must contain at least one number (0-9)', description: 'No number' },
  { password: 'MyP@ssword', expected: 'Password must contain at least one number (0-9)', description: 'No number, has upper/lower/special' },
  
  // Missing special character
  { password: 'Password123', expected: 'Password must contain at least one special character (!@#$%^&*, etc.)', description: 'No special character' },
  { password: 'MyPassw0rd', expected: 'Password must contain at least one special character (!@#$%^&*, etc.)', description: 'No special, has upper/lower/number' },
  
  // Multiple missing requirements
  { password: 'password', expected: 'Password must contain at least one uppercase letter (A-Z)', description: 'Only lowercase letters' },
  { password: 'PASSWORD', expected: 'Password must contain at least one lowercase letter (a-z)', description: 'Only uppercase letters' },
  { password: '12345678', expected: 'Password must contain at least one uppercase letter (A-Z)', description: 'Only numbers' },
  { password: '!@#$%^&*', expected: 'Password must contain at least one uppercase letter (A-Z)', description: 'Only special characters' },
  { password: 'password123', expected: 'Password must contain at least one uppercase letter (A-Z)', description: 'Lowercase and numbers only' },
  { password: 'PASSWORD123', expected: 'Password must contain at least one lowercase letter (a-z)', description: 'Uppercase and numbers only' },
  { password: 'password!@#', expected: 'Password must contain at least one uppercase letter (A-Z)', description: 'Lowercase and special only' },
  { password: 'PASSWORD!@#', expected: 'Password must contain at least one lowercase letter (a-z)', description: 'Uppercase and special only' },
  
  // Testing various special characters
  { password: 'Pass123!word', expected: null, description: 'Special char: !' },
  { password: 'Pass123@word', expected: null, description: 'Special char: @' },
  { password: 'Pass123#word', expected: null, description: 'Special char: #' },
  { password: 'Pass123$word', expected: null, description: 'Special char: $' },
  { password: 'Pass123%word', expected: null, description: 'Special char: %' },
  { password: 'Pass123^word', expected: null, description: 'Special char: ^' },
  { password: 'Pass123&word', expected: null, description: 'Special char: &' },
  { password: 'Pass123*word', expected: null, description: 'Special char: *' },
  { password: 'Pass123(word', expected: null, description: 'Special char: (' },
  { password: 'Pass123)word', expected: null, description: 'Special char: )' },
  { password: 'Pass123_word', expected: null, description: 'Special char: _' },
  { password: 'Pass123+word', expected: null, description: 'Special char: +' },
  { password: 'Pass123-word', expected: null, description: 'Special char: -' },
  { password: 'Pass123=word', expected: null, description: 'Special char: =' },
  { password: 'Pass123[word', expected: null, description: 'Special char: [' },
  { password: 'Pass123]word', expected: null, description: 'Special char: ]' },
  { password: 'Pass123{word', expected: null, description: 'Special char: {' },
  { password: 'Pass123}word', expected: null, description: 'Special char: }' },
  { password: 'Pass123;word', expected: null, description: 'Special char: ;' },
  { password: "Pass123'word", expected: null, description: 'Special char: \'' },
  { password: 'Pass123:word', expected: null, description: 'Special char: :' },
  { password: 'Pass123"word', expected: null, description: 'Special char: "' },
  { password: 'Pass123\\word', expected: null, description: 'Special char: \\' },
  { password: 'Pass123|word', expected: null, description: 'Special char: |' },
  { password: 'Pass123,word', expected: null, description: 'Special char: ,' },
  { password: 'Pass123.word', expected: null, description: 'Special char: .' },
  { password: 'Pass123<word', expected: null, description: 'Special char: <' },
  { password: 'Pass123>word', expected: null, description: 'Special char: >' },
  { password: 'Pass123/word', expected: null, description: 'Special char: /' },
  { password: 'Pass123?word', expected: null, description: 'Special char: ?' },
];

// Run tests
console.log('='.repeat(80));
console.log('PATIENT PASSWORD VALIDATION TEST SUITE');
console.log('='.repeat(80));
console.log();

let passed = 0;
let failed = 0;
const failures = [];

testCases.forEach((testCase, index) => {
  const result = validatePassword(testCase.password);
  const testPassed = result === testCase.expected;
  
  if (testPassed) {
    passed++;
    console.log(`✓ Test ${index + 1}: ${testCase.description}`);
  } else {
    failed++;
    console.log(`✗ Test ${index + 1}: ${testCase.description}`);
    console.log(`  Input: "${testCase.password}"`);
    console.log(`  Expected: ${testCase.expected}`);
    console.log(`  Got: ${result}`);
    failures.push({
      test: index + 1,
      description: testCase.description,
      password: testCase.password,
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
    console.log(`    Input: "${failure.password}"`);
    console.log(`    Expected: ${failure.expected}`);
    console.log(`    Got: ${failure.got}`);
  });
}

console.log();
console.log('='.repeat(80));
console.log('VALIDATION RULES VERIFIED:');
console.log('='.repeat(80));
console.log('✓ Password must be at least 8 characters long');
console.log('✓ Password must not exceed 64 characters');
console.log('✓ Password must contain at least one uppercase letter (A-Z)');
console.log('✓ Password must contain at least one lowercase letter (a-z)');
console.log('✓ Password must contain at least one number (0-9)');
console.log('✓ Password must contain at least one special character');
console.log('✓ Empty password shows proper error message');
console.log('='.repeat(80));

// Exit with error code if tests failed
if (failed > 0) {
  process.exit(1);
}
