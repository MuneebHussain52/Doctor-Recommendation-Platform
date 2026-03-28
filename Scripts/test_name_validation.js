// Name validation test
const validateName = (name, fieldName, isOptional = false) => {
  // If optional and empty, it's valid
  if (isOptional && !name) return null;
  
  // If required and empty
  if (!isOptional && !name) return `${fieldName} is required`;
  
  // Trim the name
  const trimmedName = name.trim();
  
  // Check length
  if (trimmedName.length < 2) return `${fieldName} must be at least 2 characters`;
  if (trimmedName.length > 30) return `${fieldName} must not exceed 30 characters`;
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  if (!/^[A-Za-z]([A-Za-z\s'-])*[A-Za-z]$|^[A-Za-z]$/.test(trimmedName)) {
    return `${fieldName} must contain only letters, and may include hyphens (-) or apostrophes (')`;
  }
  
  return null;
}

// Test cases
const testCases = [
  // Valid names
  { name: 'John', field: 'First name', optional: false, expected: 'PASS', reason: 'Simple valid name' },
  { name: 'Mary-Jane', field: 'First name', optional: false, expected: 'PASS', reason: 'Name with hyphen' },
  { name: "O'Brien", field: 'Last name', optional: false, expected: 'PASS', reason: 'Name with apostrophe' },
  { name: 'Anne Marie', field: 'First name', optional: false, expected: 'PASS', reason: 'Name with space' },
  { name: 'Li', field: 'Last name', optional: false, expected: 'PASS', reason: 'Two character name' },
  { name: '', field: 'Middle name', optional: true, expected: 'PASS', reason: 'Empty optional field' },
  { name: 'Jean-Claude', field: 'First name', optional: false, expected: 'PASS', reason: 'Hyphenated name' },
  { name: "D'Angelo", field: 'Last name', optional: false, expected: 'PASS', reason: 'Name with apostrophe' },
  
  // Invalid names
  { name: 'J', field: 'First name', optional: false, expected: 'FAIL', reason: 'Too short (1 char)' },
  { name: 'John123', field: 'First name', optional: false, expected: 'FAIL', reason: 'Contains numbers' },
  { name: 'John@Smith', field: 'Last name', optional: false, expected: 'FAIL', reason: 'Contains @ symbol' },
  { name: 'John_Doe', field: 'Last name', optional: false, expected: 'FAIL', reason: 'Contains underscore' },
  { name: '', field: 'First name', optional: false, expected: 'FAIL', reason: 'Empty required field' },
  { name: 'a'.repeat(31), field: 'First name', optional: false, expected: 'FAIL', reason: 'Too long (31 chars)' },
  { name: '123', field: 'First name', optional: false, expected: 'FAIL', reason: 'Only numbers' },
  { name: '-John', field: 'First name', optional: false, expected: 'FAIL', reason: 'Starts with hyphen' },
  { name: 'John-', field: 'First name', optional: false, expected: 'FAIL', reason: 'Ends with hyphen' },
  { name: "'John", field: 'First name', optional: false, expected: 'FAIL', reason: 'Starts with apostrophe' },
];

console.log('\n=== Name Validation Test Results ===\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = validateName(testCase.name, testCase.field, testCase.optional);
  const isValid = result === null;
  const actualResult = isValid ? 'PASS' : 'FAIL';
  const success = actualResult === testCase.expected;
  
  if (success) {
    passed++;
    console.log(`✅ Test ${index + 1}: ${testCase.reason}`);
    console.log(`   Name: "${testCase.name}" (${testCase.field}${testCase.optional ? ' - Optional' : ''})`);
    console.log(`   Result: ${actualResult} (Expected: ${testCase.expected})`);
    if (!isValid) {
      console.log(`   Error: ${result}`);
    }
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: ${testCase.reason}`);
    console.log(`   Name: "${testCase.name}" (${testCase.field}${testCase.optional ? ' - Optional' : ''})`);
    console.log(`   Result: ${actualResult} (Expected: ${testCase.expected})`);
    if (result) {
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

// Additional edge case tests
console.log('\n=== Edge Case Tests ===\n');

const edgeCases = [
  { name: 'Mary Jane Watson', field: 'First name', optional: false },
  { name: 'Jean-Paul-Marie', field: 'First name', optional: false },
  { name: "O'Neil-Smith", field: 'Last name', optional: false },
  { name: 'A', field: 'First name', optional: false },
];

edgeCases.forEach((testCase) => {
  const result = validateName(testCase.name, testCase.field, testCase.optional);
  console.log(`Name: "${testCase.name}"`);
  console.log(`Result: ${result === null ? '✅ Valid' : `❌ ${result}`}`);
  console.log('');
});
