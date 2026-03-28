// Test file for first name and last name auto-capitalization
// This simulates the capitalization logic in the Register.tsx component

function capitalizeFirstLetter(value) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

// Test cases
const testCases = [
  // Valid inputs
  { input: "john", expected: "John", description: "Lowercase name" },
  { input: "JOHN", expected: "John", description: "Uppercase name" },
  { input: "JoHn", expected: "John", description: "Mixed case name" },
  { input: "mary", expected: "Mary", description: "Lowercase name (Mary)" },
  { input: "SMITH", expected: "Smith", description: "Uppercase last name" },
  { input: "o'brien", expected: "O'brien", description: "Name with apostrophe" },
  { input: "anne-marie", expected: "Anne-marie", description: "Hyphenated name" },
  { input: "a", expected: "A", description: "Single letter" },
  { input: "ab", expected: "Ab", description: "Two letters" },
  
  // Edge cases
  { input: "", expected: "", description: "Empty string" },
  { input: "j", expected: "J", description: "Single character lowercase" },
  { input: "J", expected: "J", description: "Single character uppercase" },
  
  // Names with special characters
  { input: "jean-paul", expected: "Jean-paul", description: "Hyphenated French name" },
  { input: "o'connor", expected: "O'connor", description: "Irish name with apostrophe" },
  { input: "d'angelo", expected: "D'angelo", description: "Italian name with apostrophe" },
  
  // Common names
  { input: "michael", expected: "Michael", description: "Common name Michael" },
  { input: "ELIZABETH", expected: "Elizabeth", description: "Common name Elizabeth" },
  { input: "rodriguez", expected: "Rodriguez", description: "Hispanic last name" },
  { input: "ANDERSON", expected: "Anderson", description: "Common last name" },
];

// Run tests
console.log('Running first name / last name capitalization tests...\n');
let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = capitalizeFirstLetter(test.input);
  const success = result === test.expected;
  
  if (success) {
    passed++;
    console.log(`✓ Test ${index + 1}: ${test.description}`);
  } else {
    failed++;
    console.log(`✗ Test ${index + 1}: ${test.description}`);
    console.log(`  Input: "${test.input}"`);
    console.log(`  Expected: "${test.expected}"`);
    console.log(`  Got: "${result}"`);
  }
});

console.log(`\n${passed}/${testCases.length} tests passed`);

if (failed > 0) {
  process.exit(1);
}
