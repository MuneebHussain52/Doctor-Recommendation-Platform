// Password validation test
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

// Test cases
const testCases = [
  { password: 'Pass1@', expected: 'FAIL', reason: 'Too short (less than 8 chars)' },
  { password: 'P@ssw0rd' + 'a'.repeat(60), expected: 'FAIL', reason: 'Too long (more than 64 chars)' },
  { password: 'password123@', expected: 'FAIL', reason: 'No uppercase letter' },
  { password: 'PASSWORD123@', expected: 'FAIL', reason: 'No lowercase letter' },
  { password: 'Password@', expected: 'FAIL', reason: 'No number' },
  { password: 'Password123', expected: 'FAIL', reason: 'No special character' },
  { password: 'MyP@ssw0rd123', expected: 'PASS', reason: 'Valid password' },
  { password: 'Secure#2024Pass', expected: 'PASS', reason: 'Valid password with #' },
  { password: 'Test$1234Abc', expected: 'PASS', reason: 'Valid password with $' },
  { password: 'Admin!2024', expected: 'PASS', reason: 'Valid password with !' },
];

console.log('\n=== Password Validation Test Results ===\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = validatePassword(testCase.password);
  const isValid = result === null;
  const actualResult = isValid ? 'PASS' : 'FAIL';
  const success = actualResult === testCase.expected;
  
  if (success) {
    passed++;
    console.log(`✅ Test ${index + 1}: ${testCase.reason}`);
    console.log(`   Password: "${testCase.password.substring(0, 20)}${testCase.password.length > 20 ? '...' : ''}"`);
    console.log(`   Result: ${actualResult} (Expected: ${testCase.expected})`);
    if (!isValid) {
      console.log(`   Error: ${result}`);
    }
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: ${testCase.reason}`);
    console.log(`   Password: "${testCase.password.substring(0, 20)}${testCase.password.length > 20 ? '...' : ''}"`);
    console.log(`   Result: ${actualResult} (Expected: ${testCase.expected})`);
    if (!isValid) {
      console.log(`   Error: ${result}`);
    }
  }
  console.log('');
});

console.log(`\n=== Summary ===`);
console.log(`Total Tests: ${testCases.length}`);
console.log(`Passed: ${passed} ✅`);
console.log(`Failed: ${failed} ❌`);
console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%\n`);
