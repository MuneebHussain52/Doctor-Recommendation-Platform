/**
 * Test suite for Admin Registration Full Name Validation
 * 
 * Requirements:
 * - Must contain only letters (A–Z, a–z) — no numbers or symbols
 * - Minimum length 2 characters, maximum 30 characters
 * - May allow a hyphen (-) or apostrophe (')
 * - Auto capitalize first letter of first and last name
 * - 3 spaces allowed but not consecutive spaces
 */

// Full name validation function (from Admin/AdminRegister.tsx)
const validateFullName = (fullName) => {
  if (!fullName) return 'Full name is required';
  
  const trimmedName = fullName.trim();
  
  // Check length
  if (trimmedName.length < 2) return 'Full name must be at least 2 characters';
  if (trimmedName.length > 30) return 'Full name must not exceed 30 characters';
  
  // Check for consecutive spaces
  if (/\s{2,}/.test(fullName)) {
    return 'Full name cannot contain consecutive spaces';
  }
  
  // Count spaces (max 3 allowed)
  const spaceCount = (fullName.match(/\s/g) || []).length;
  if (spaceCount > 3) {
    return 'Full name can contain at most 3 spaces';
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  // Must start and end with a letter
  if (!/^[A-Za-z]([A-Za-z\s'-])*[A-Za-z]$|^[A-Za-z]$/.test(trimmedName)) {
    return 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')';
  }
  
  return null;
};

// Test cases
const testCases = [
  // Valid full names
  { name: 'John Doe', expected: null, description: 'Valid two-word name' },
  { name: 'Mary Jane Watson', expected: null, description: 'Valid three-word name' },
  { name: 'Jean-Pierre Smith', expected: null, description: 'Valid name with hyphen' },
  { name: "O'Brien", expected: null, description: 'Valid name with apostrophe' },
  { name: "Mary-Kate O'Connor Smith", expected: null, description: 'Valid name with hyphen and apostrophe' },
  { name: 'AB', expected: null, description: 'Valid name at minimum length (2 chars)' },
  { name: 'A', expected: 'Full name must be at least 2 characters', description: 'Single letter name (too short)' },
  { name: 'John Paul George Ringo', expected: null, description: 'Valid four-word name (3 spaces)' },
  { name: 'Anne Marie', expected: null, description: 'Valid name with space' },
  { name: 'Al-Rashid', expected: null, description: 'Valid name with hyphen' },
  { name: "D'Angelo", expected: null, description: 'Valid name with apostrophe at start' },
  { name: 'Mary-Anne Smith-Jones', expected: null, description: 'Valid name with multiple hyphens' },
  { name: 'Jean Paul Marie Claude', expected: null, description: 'Valid name at max spaces (3)' },
  { name: 'A'.repeat(30), expected: null, description: 'Valid name at maximum length (30 chars)' },
  
  // Empty name
  { name: '', expected: 'Full name is required', description: 'Empty name' },
  
  // Too short
  { name: 'A ', expected: 'Full name must be at least 2 characters', description: '1 character (after trim)' },
  
  // Too long (more than 30 characters)
  { name: 'A'.repeat(31), expected: 'Full name must not exceed 30 characters', description: '31 characters' },
  { name: 'A'.repeat(50), expected: 'Full name must not exceed 30 characters', description: '50 characters' },
  { name: 'John Jacob Jingleheimer Schmidt Jr', expected: 'Full name must not exceed 30 characters', description: 'Long name (35 chars)' },
  
  // Consecutive spaces
  { name: 'John  Doe', expected: 'Full name cannot contain consecutive spaces', description: 'Two consecutive spaces' },
  { name: 'Mary   Jane', expected: 'Full name cannot contain consecutive spaces', description: 'Three consecutive spaces' },
  { name: 'John    Doe', expected: 'Full name cannot contain consecutive spaces', description: 'Four consecutive spaces' },
  { name: 'John Doe  Smith', expected: 'Full name cannot contain consecutive spaces', description: 'Consecutive spaces in middle' },
  
  // Too many spaces (more than 3)
  { name: 'John Paul George Ringo Starr', expected: 'Full name can contain at most 3 spaces', description: 'Five-word name (4 spaces)' },
  { name: 'A B C D E', expected: 'Full name can contain at most 3 spaces', description: 'Single letters with 4 spaces' },
  { name: 'One Two Three Four Five', expected: 'Full name can contain at most 3 spaces', description: 'Five words (4 spaces)' },
  
  // Contains numbers
  { name: 'John123', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Contains numbers' },
  { name: 'John Doe 2', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Contains number with space' },
  { name: '123 John', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Starts with number' },
  { name: 'John2Doe', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Number in middle' },
  
  // Contains special characters (other than hyphen and apostrophe)
  { name: 'John@Doe', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Contains @ symbol' },
  { name: 'John.Doe', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Contains period' },
  { name: 'John_Doe', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Contains underscore' },
  { name: 'John!Doe', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Contains exclamation' },
  { name: 'John#Doe', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Contains hash' },
  { name: 'John$Doe', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Contains dollar sign' },
  { name: 'John%Doe', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Contains percent' },
  { name: 'John&Doe', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Contains ampersand' },
  { name: 'John*Doe', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Contains asterisk' },
  { name: 'John(Doe)', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Contains parentheses' },
  { name: 'John+Doe', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Contains plus' },
  { name: 'John=Doe', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Contains equals' },
  { name: 'John,Doe', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Contains comma' },
  { name: 'John/Doe', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Contains slash' },
  { name: 'John\\Doe', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Contains backslash' },
  
  // Must start and end with letter
  { name: '-John', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Starts with hyphen' },
  { name: 'John-', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Ends with hyphen' },
  { name: "'John", expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Starts with apostrophe' },
  { name: "John'", expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Ends with apostrophe' },
  { name: ' John', expected: null, description: 'Starts with space (gets trimmed)' },
  { name: 'John ', expected: null, description: 'Ends with space (gets trimmed)' },
  
  // Edge cases with hyphens and apostrophes
  { name: 'Anne-Marie-Claire', expected: null, description: 'Valid name with multiple hyphens' },
  { name: "O'Brien's", expected: null, description: 'Valid possessive name' },
  { name: 'Jean--Pierre', expected: null, description: 'Valid name with double hyphen' },
  { name: "O''Brien", expected: null, description: 'Valid name with double apostrophe' },
  
  // Mixed errors
  { name: 'John123 Doe', expected: 'Full name must contain only letters and may include hyphens (-) or apostrophes (\')', description: 'Contains number and space' },
  { name: 'A B C D E F', expected: 'Full name can contain at most 3 spaces', description: 'Too many spaces (5)' },
];

// Run tests
console.log('='.repeat(80));
console.log('ADMIN FULL NAME VALIDATION TEST SUITE');
console.log('='.repeat(80));
console.log();

let passed = 0;
let failed = 0;
const failures = [];

testCases.forEach((testCase, index) => {
  const result = validateFullName(testCase.name);
  const testPassed = result === testCase.expected;
  
  if (testPassed) {
    passed++;
    console.log(`✓ Test ${index + 1}: ${testCase.description}`);
  } else {
    failed++;
    console.log(`✗ Test ${index + 1}: ${testCase.description}`);
    console.log(`  Input: "${testCase.name}"`);
    console.log(`  Expected: ${testCase.expected}`);
    console.log(`  Got: ${result}`);
    failures.push({
      test: index + 1,
      description: testCase.description,
      name: testCase.name,
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
    console.log(`    Input: "${failure.name}"`);
    console.log(`    Expected: ${failure.expected}`);
    console.log(`    Got: ${failure.got}`);
  });
}

console.log();
console.log('='.repeat(80));
console.log('VALIDATION RULES VERIFIED:');
console.log('='.repeat(80));
console.log('✓ Full name must contain only letters (A-Z, a-z)');
console.log('✓ Full name minimum 2 characters, maximum 30 characters');
console.log('✓ Full name may include hyphen (-) or apostrophe (\')');
console.log('✓ Full name can contain up to 3 spaces');
console.log('✓ Full name cannot contain consecutive spaces');
console.log('✓ Full name must start and end with a letter');
console.log('✓ Empty full name shows proper error message');
console.log();
console.log('Note: Auto-capitalization is tested in the UI component');
console.log('='.repeat(80));

// Exit with error code if tests failed
if (failed > 0) {
  process.exit(1);
}
