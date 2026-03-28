// Test file for date of birth and gender validation
// This simulates the validation logic in the Register.tsx component

function validateDateOfBirth(dob) {
  if (!dob) return 'Date of birth is required';
  
  const selectedDate = new Date(dob);
  const today = new Date();
  
  // Check if date is valid
  if (isNaN(selectedDate.getTime())) return 'Invalid date';
  
  // Check if date is in the future
  if (selectedDate > today) return 'Date of birth cannot be in the future';
  
  // Calculate age
  const age = today.getFullYear() - selectedDate.getFullYear();
  const monthDiff = today.getMonth() - selectedDate.getMonth();
  const dayDiff = today.getDate() - selectedDate.getDate();
  const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
  
  // Check minimum age (25 years for doctors)
  if (actualAge < 25) return 'You must be at least 25 years old';
  
  // Check maximum age (80 years for doctors)
  if (actualAge > 80) return 'Age cannot exceed 80 years';
  
  return null;
}

function validateGender(gender) {
  if (!gender) return 'Gender is required';
  return null;
}

// Test cases
const testCases = [
  // Date of Birth Tests
  { type: 'dob', input: "", expected: 'Date of birth is required', description: "Invalid: Empty date of birth" },
  { type: 'dob', input: null, expected: 'Date of birth is required', description: "Invalid: Null date of birth" },
  { type: 'dob', input: undefined, expected: 'Date of birth is required', description: "Invalid: Undefined date of birth" },
  { type: 'dob', input: "2030-01-01", expected: 'Date of birth cannot be in the future', description: "Invalid: Future date" },
  { type: 'dob', input: "2020-01-01", expected: 'You must be at least 25 years old', description: "Invalid: Too young (5 years old)" },
  { type: 'dob', input: "2010-01-01", expected: 'You must be at least 25 years old', description: "Invalid: Too young (15 years old)" },
  { type: 'dob', input: "2008-01-01", expected: 'You must be at least 25 years old', description: "Invalid: Too young (17 years old)" },
  { type: 'dob', input: "2005-01-01", expected: 'You must be at least 25 years old', description: "Invalid: Too young (20 years old)" },
  { type: 'dob', input: "2001-12-12", expected: 'You must be at least 25 years old', description: "Invalid: Just under 25 (23 years old)" },
  { type: 'dob', input: "2000-11-13", expected: null, description: "Valid: Exactly 25 years old" },
  { type: 'dob', input: "2000-01-01", expected: null, description: "Valid: 25 years old" },
  { type: 'dob', input: "1995-06-15", expected: null, description: "Valid: 30 years old" },
  { type: 'dob', input: "1990-03-20", expected: null, description: "Valid: 35 years old" },
  { type: 'dob', input: "1980-12-31", expected: null, description: "Valid: 44 years old" },
  { type: 'dob', input: "1970-01-01", expected: null, description: "Valid: 55 years old" },
  { type: 'dob', input: "1960-05-10", expected: null, description: "Valid: 65 years old" },
  { type: 'dob', input: "1950-08-25", expected: null, description: "Valid: 75 years old" },
  { type: 'dob', input: "1945-11-13", expected: null, description: "Valid: Exactly 80 years old" },
  { type: 'dob', input: "1944-01-01", expected: 'Age cannot exceed 80 years', description: "Invalid: Over 80 (81 years old)" },
  { type: 'dob', input: "1940-08-25", expected: 'Age cannot exceed 80 years', description: "Invalid: Over 80 (85 years old)" },
  { type: 'dob', input: "1920-01-01", expected: 'Age cannot exceed 80 years', description: "Invalid: Over 80 (105 years old)" },
  { type: 'dob', input: "1900-01-01", expected: 'Age cannot exceed 80 years', description: "Invalid: Over 80 (125 years old)" },
  { type: 'dob', input: "invalid-date", expected: 'Invalid date', description: "Invalid: Invalid date format" },
  
  // Gender Tests
  { type: 'gender', input: "", expected: 'Gender is required', description: "Invalid: Empty gender" },
  { type: 'gender', input: null, expected: 'Gender is required', description: "Invalid: Null gender" },
  { type: 'gender', input: undefined, expected: 'Gender is required', description: "Invalid: Undefined gender" },
  { type: 'gender', input: "Male", expected: null, description: "Valid: Male" },
  { type: 'gender', input: "Female", expected: null, description: "Valid: Female" },
  { type: 'gender', input: "Other", expected: null, description: "Valid: Other" },
  { type: 'gender', input: "male", expected: null, description: "Valid: male (lowercase)" },
  { type: 'gender', input: "FEMALE", expected: null, description: "Valid: FEMALE (uppercase)" },
  { type: 'gender', input: "Prefer not to say", expected: null, description: "Valid: Any non-empty string" },
];

// Run tests
console.log('Running date of birth and gender validation tests...\n');
let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = test.type === 'dob' ? validateDateOfBirth(test.input) : validateGender(test.input);
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
  process.exit(1);
}
