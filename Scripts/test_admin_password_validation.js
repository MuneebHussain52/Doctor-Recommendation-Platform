// Admin Password Validation Tests
// Requirements:
// - Password must be at least 8 characters long
// - Password should not be too long (max 64 characters)
// - Must contain at least one uppercase letter (A–Z)
// - Must contain at least one lowercase letter (a–z)
// - Must contain at least one number (0–9)
// - Must contain at least one special character (like !, @, #, $, %, etc.)

const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (password.length > 64) return 'Password must not exceed 64 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter (A-Z)';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter (a-z)';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number (0-9)';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return 'Password must contain at least one special character (!@#$%^&*, etc.)';
  return null;
}

// Test Suite
console.log('='.repeat(80));
console.log('ADMIN PASSWORD VALIDATION TEST SUITE');
console.log('='.repeat(80));

let passed = 0;
let failed = 0;

const test = (testName, password, expectedError) => {
  const result = validatePassword(password);
  const success = result === expectedError;
  
  if (success) {
    console.log(`✓ Test ${passed + failed + 1}: ${testName}`);
    passed++;
  } else {
    console.log(`✗ Test ${passed + failed + 1}: ${testName}`);
    console.log(`  Expected: ${expectedError}`);
    console.log(`  Got: ${result}`);
    failed++;
  }
}

// Valid passwords (all requirements met)
console.log('\n--- Valid Passwords (all requirements met) ---');
test('Valid password with all requirements', 'Password123!', null);
test('Valid password with multiple special chars', 'MyP@ssw0rd#2024', null);
test('Valid password with underscore', 'Test_Pass123', null);
test('Valid password with mixed special chars', 'Abc123!@#$%', null);
test('Valid password at minimum length (8 chars)', 'Abc123!@', null);
test('Valid password at maximum length (64 chars)', 'A'.repeat(30) + 'a'.repeat(30) + '12!@', null);
test('Valid password with bracket special chars', 'Pass123[word]', null);
test('Valid password with semicolon', 'MyPass123;word', null);

// Empty password
console.log('\n--- Empty Password ---');
test('Empty password', '', 'Password is required');

// Too short (less than 8 characters)
console.log('\n--- Too Short (< 8 characters) ---');
test('7 characters with all requirements', 'Abc12!@', 'Password must be at least 8 characters long');
test('5 characters', 'Abc1!', 'Password must be at least 8 characters long');
test('1 character', 'A', 'Password must be at least 8 characters long');

// Too long (more than 64 characters)
console.log('\n--- Too Long (> 64 characters) ---');
test('65 characters (over by 1)', 'A'.repeat(31) + 'a'.repeat(31) + '12!@', 'Password must not exceed 64 characters');
test('100 characters (way over)', 'A'.repeat(50) + 'a'.repeat(47) + '12!', 'Password must not exceed 64 characters');

// Missing uppercase letter
console.log('\n--- Missing Uppercase Letter ---');
test('No uppercase - all lowercase', 'password123!', 'Password must contain at least one uppercase letter (A-Z)');
test('No uppercase - numbers and special', '12345678!@#', 'Password must contain at least one uppercase letter (A-Z)');
test('No uppercase - lowercase with special', 'abcdefgh!@#', 'Password must contain at least one uppercase letter (A-Z)');

// Missing lowercase letter
console.log('\n--- Missing Lowercase Letter ---');
test('No lowercase - all uppercase', 'PASSWORD123!', 'Password must contain at least one lowercase letter (a-z)');
test('No lowercase - uppercase with numbers', 'ABCD1234!@', 'Password must contain at least one lowercase letter (a-z)');
test('No lowercase - uppercase with special', 'ABCDEFGH!@#', 'Password must contain at least one lowercase letter (a-z)');

// Missing number
console.log('\n--- Missing Number ---');
test('No number - letters and special only', 'Password!@#', 'Password must contain at least one number (0-9)');
test('No number - all letters', 'PasswordTest', 'Password must contain at least one number (0-9)');
test('No number - letters with special', 'AbCdEfGh!@', 'Password must contain at least one number (0-9)');

// Missing special character
console.log('\n--- Missing Special Character ---');
test('No special - letters and numbers only', 'Password123', 'Password must contain at least one special character (!@#$%^&*, etc.)');
test('No special - all alphanumeric', 'MyPassword123', 'Password must contain at least one special character (!@#$%^&*, etc.)');
test('No special - mixed case and numbers', 'Abc123XYZ', 'Password must contain at least one special character (!@#$%^&*, etc.)');

// Multiple missing requirements
console.log('\n--- Multiple Missing Requirements ---');
test('Missing uppercase and number', 'password!@#', 'Password must contain at least one uppercase letter (A-Z)');
test('Missing lowercase and special', 'PASSWORD123', 'Password must contain at least one lowercase letter (a-z)');
test('Missing number and special', 'PasswordTest', 'Password must contain at least one number (0-9)');
test('Only lowercase letters', 'abcdefgh', 'Password must contain at least one uppercase letter (A-Z)');
test('Only uppercase letters', 'ABCDEFGH', 'Password must contain at least one lowercase letter (a-z)');
test('Only numbers', '12345678', 'Password must contain at least one uppercase letter (A-Z)');
test('Only special characters', '!@#$%^&*()', 'Password must contain at least one uppercase letter (A-Z)');

// Edge cases with various special characters
console.log('\n--- Various Special Characters ---');
test('Password with exclamation', 'Password1!', null);
test('Password with at sign', 'Password1@', null);
test('Password with hash', 'Password1#', null);
test('Password with dollar', 'Password1$', null);
test('Password with percent', 'Password1%', null);
test('Password with caret', 'Password1^', null);
test('Password with ampersand', 'Password1&', null);
test('Password with asterisk', 'Password1*', null);
test('Password with parentheses', 'Password1()', null);
test('Password with underscore', 'Password1_', null);
test('Password with plus', 'Password1+', null);
test('Password with minus', 'Password1-', null);
test('Password with equals', 'Password1=', null);
test('Password with brackets', 'Password1[]', null);
test('Password with braces', 'Password1{}', null);
test('Password with semicolon', 'Password1;', null);
test('Password with colon', 'Password1:', null);
test('Password with quotes', 'Password1"', null);
test('Password with single quote', "Password1'", null);
test('Password with backslash', 'Password1\\', null);
test('Password with pipe', 'Password1|', null);
test('Password with comma', 'Password1,', null);
test('Password with dot', 'Password1.', null);
test('Password with less than', 'Password1<', null);
test('Password with greater than', 'Password1>', null);
test('Password with slash', 'Password1/', null);
test('Password with question mark', 'Password1?', null);

// Length edge cases
console.log('\n--- Length Edge Cases ---');
test('Exactly 8 characters (minimum)', 'Abc123!@', null);
test('Exactly 64 characters (maximum)', 'A' + 'a'.repeat(60) + '12!', null);
test('7 characters (just under minimum)', 'Abc12!@', 'Password must be at least 8 characters long');
test('65 characters (just over maximum)', 'A' + 'a'.repeat(61) + '12!', 'Password must not exceed 64 characters');

// Combined valid with all special character types
console.log('\n--- Complex Valid Passwords ---');
test('Password with multiple special types', 'MyP@ssw0rd!2024#', null);
test('Password with all character types mixed', 'aB3!cD4@eF5#gH6$', null);
test('Password starting with number', '1Password!', null);
test('Password starting with special', '!Password1', null);

// Summary
console.log('\n' + '='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));
console.log(`Total Tests: ${passed + failed}`);
console.log(`Passed: ${passed} (${((passed / (passed + failed)) * 100).toFixed(0)}%)`);
console.log(`Failed: ${failed}\n`);

console.log('='.repeat(80));
console.log('VALIDATION RULES VERIFIED:');
console.log('='.repeat(80));
console.log('✓ Password must be at least 8 characters long');
console.log('✓ Password must not exceed 64 characters');
console.log('✓ Must contain at least one uppercase letter (A-Z)');
console.log('✓ Must contain at least one lowercase letter (a-z)');
console.log('✓ Must contain at least one number (0-9)');
console.log('✓ Must contain at least one special character');
console.log('✓ Empty password shows proper error message');
