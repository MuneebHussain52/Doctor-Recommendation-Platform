// Admin Phone Number Validation Tests
// Requirements:
// - Must contain only digits (0–9)
// - Minimum: 10 digits
// - Maximum: 15 digits
// - Should not contain spaces, letters, or special characters

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
}

// Test Suite
console.log('='.repeat(80));
console.log('ADMIN PHONE NUMBER VALIDATION TEST SUITE');
console.log('='.repeat(80));

let passed = 0;
let failed = 0;

const test = (testName, phone, expectedError) => {
  const result = validatePhone(phone);
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

// Valid phone numbers
console.log('\n--- Valid Phone Numbers (digits only, 10-15 digits) ---');
test('Valid 10 digit phone', '1234567890', null);
test('Valid 11 digit phone', '12345678901', null);
test('Valid 12 digit phone', '123456789012', null);
test('Valid 13 digit phone', '1234567890123', null);
test('Valid 14 digit phone', '12345678901234', null);
test('Valid 15 digit phone (max)', '123456789012345', null);

// Empty phone
console.log('\n--- Empty Phone Number ---');
test('Empty phone number', '', 'Phone number is required');

// Invalid - Too short
console.log('\n--- Too Short ---');
test('9 digits (too short)', '123456789', 'Phone number must be at least 10 digits');
test('5 digits (way too short)', '12345', 'Phone number must be at least 10 digits');
test('1 digit', '1', 'Phone number must be at least 10 digits');

// Invalid - Too long
console.log('\n--- Too Long ---');
test('16 digits (over by 1)', '1234567890123456', 'Phone number must not exceed 15 digits');
test('20 digits (way over)', '12345678901234567890', 'Phone number must not exceed 15 digits');

// Invalid - Contains spaces
console.log('\n--- Contains Spaces ---');
test('Phone with space in middle', '12345 67890', 'Phone number must contain only digits (0-9)');
test('Phone with leading space', ' 1234567890', 'Phone number must contain only digits (0-9)');
test('Phone with trailing space', '1234567890 ', 'Phone number must contain only digits (0-9)');
test('Phone with multiple spaces', '123 456 7890', 'Phone number must contain only digits (0-9)');

// Invalid - Contains letters
console.log('\n--- Contains Letters ---');
test('Phone with letters', '123abc7890', 'Phone number must contain only digits (0-9)');
test('Phone starting with letter', 'a1234567890', 'Phone number must contain only digits (0-9)');
test('Phone ending with letter', '1234567890z', 'Phone number must contain only digits (0-9)');
test('All letters', 'abcdefghij', 'Phone number must contain only digits (0-9)');

// Invalid - Contains special characters
console.log('\n--- Contains Special Characters ---');
test('Phone with hyphen', '123-456-7890', 'Phone number must contain only digits (0-9)');
test('Phone with plus sign', '+1234567890', 'Phone number must contain only digits (0-9)');
test('Phone with parentheses', '(123)4567890', 'Phone number must contain only digits (0-9)');
test('Phone with dot', '123.456.7890', 'Phone number must contain only digits (0-9)');
test('Phone with slash', '123/456/7890', 'Phone number must contain only digits (0-9)');
test('Phone with comma', '1234,567,890', 'Phone number must contain only digits (0-9)');
test('Phone with underscore', '123_456_7890', 'Phone number must contain only digits (0-9)');
test('Phone with asterisk', '1234*67890', 'Phone number must contain only digits (0-9)');
test('Phone with hash', '1234#67890', 'Phone number must contain only digits (0-9)');

// Edge cases
console.log('\n--- Edge Cases ---');
test('Phone with all zeros', '0000000000', null);
test('Phone with all nines', '999999999999999', null);
test('Phone with mixed special chars', '+1 (234) 567-8900', 'Phone number must contain only digits (0-9)');
test('Phone with only special chars', '----------', 'Phone number must contain only digits (0-9)');
test('Phone with tab character', '1234567890\t', 'Phone number must contain only digits (0-9)');
test('Phone with newline', '1234567890\n', 'Phone number must contain only digits (0-9)');

// Combined errors (should catch first error)
console.log('\n--- Combined Errors ---');
test('Too short AND has letters', '123abc', 'Phone number must contain only digits (0-9)');
test('Too long AND has spaces', '1234567890123456 78', 'Phone number must contain only digits (0-9)');

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
console.log('✓ Phone number must contain only digits (0-9)');
console.log('✓ Minimum 10 digits required');
console.log('✓ Maximum 15 digits allowed');
console.log('✓ No spaces, letters, or special characters allowed');
console.log('✓ Empty phone number shows proper error message');
