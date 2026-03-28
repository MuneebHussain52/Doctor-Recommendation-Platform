// Test file for bio validation
// Run with: node test_bio_validation.js

// Copy of the validateBio function from Register.tsx
const validateBio = (bio) => {
  // Bio is optional, so empty is OK
  if (!bio) return null;
  
  // Check for HTML tags - more specific pattern to avoid false positives with < and >
  // Matches opening tags like <p>, <div>, <span class="x">, etc.
  // Also matches self-closing tags like <br/>, <img/>
  const htmlTagPattern = /<\s*\/?[a-zA-Z][a-zA-Z0-9]*[^>]*>/g;
  if (htmlTagPattern.test(bio)) {
    return 'Bio cannot contain HTML tags or scripts';
  }
  
  // Check for script-like content
  if (bio.toLowerCase().includes('<script') || bio.toLowerCase().includes('</script>')) {
    return 'Bio cannot contain HTML tags or scripts';
  }
  
  // Check minimum length (if provided, must be at least 50 characters)
  if (bio.trim().length > 0 && bio.trim().length < 50) {
    return 'Bio must be at least 50 characters';
  }
  
  // Check maximum length
  if (bio.length > 1000) return 'Bio must not exceed 1000 characters';
  
  return null;
}

// Test cases
const testCases = [
  // Valid inputs - empty is OK
  { input: "", expected: null, description: "Valid: Empty bio (optional field)" },
  { input: null, expected: null, description: "Valid: null bio (optional field)" },
  { input: undefined, expected: null, description: "Valid: undefined bio (optional field)" },
  
  // Valid inputs - minimum length (50 characters)
  { input: "I am a cardiologist with 10 years of experience!!!", expected: null, description: "Valid: Exactly 50 characters" },
  { input: "I am a cardiologist with over 10 years of clinical experience.", expected: null, description: "Valid: More than 50 characters" },
  { input: "A".repeat(50), expected: null, description: "Valid: Exactly 50 'A' characters" },
  { input: "A".repeat(100), expected: null, description: "Valid: 100 characters" },
  
  // Invalid inputs - too short (less than 50 characters)
  { input: "Short bio", expected: 'Bio must be at least 50 characters', description: "Invalid: Only 9 characters" },
  { input: "I am a doctor", expected: 'Bio must be at least 50 characters', description: "Invalid: Only 13 characters" },
  { input: "A".repeat(49), expected: 'Bio must be at least 50 characters', description: "Invalid: 49 characters (just below minimum)" },
  { input: "A".repeat(25), expected: 'Bio must be at least 50 characters', description: "Invalid: 25 characters" },
  { input: "Hello world!", expected: 'Bio must be at least 50 characters', description: "Invalid: 12 characters" },
  { input: "   Short   ", expected: 'Bio must be at least 50 characters', description: "Invalid: Short text with spaces" },
  
  // Valid inputs - normal text
  { input: "I am a cardiologist with 10 years of experience in treating heart conditions.", expected: null, description: "Valid: Simple text over 50 chars" },
  { input: "Dr. John Smith, MD. Specializing in cardiology with extensive experience.", expected: null, description: "Valid: Text with punctuation over 50 chars" },
  { input: "Experience: 15 years. Education: Harvard Medical School. Board-certified.", expected: null, description: "Valid: Text with colons and periods over 50 chars" },
  
  // Valid inputs - with numbers
  { input: "I have worked at 5 different hospitals since 2010 with great success.", expected: null, description: "Valid: Text with numbers over 50 chars" },
  { input: "Phone: 123-456-7890, Email: doctor@example.com, Years of experience: 10", expected: null, description: "Valid: Contact information over 50 chars" },
  
  // Valid inputs - with common symbols
  { input: "I'm a doctor who specializes in children's healthcare with passion!", expected: null, description: "Valid: Apostrophes and exclamation over 50 chars" },
  { input: "Education: M.D., Ph.D., Board-certified in Internal Medicine.", expected: null, description: "Valid: Abbreviations with periods over 50 chars" },
  { input: "Interests: Reading, hiking & traveling around the world yearly.", expected: null, description: "Valid: Ampersand over 50 chars" },
  { input: "Motto: \"First, do no harm.\" This has guided my entire career.", expected: null, description: "Valid: Quotation marks over 50 chars" },
  { input: "Languages: English, Spanish (fluent), French (basic), German (learning).", expected: null, description: "Valid: Parentheses over 50 chars" },
  { input: "Awards: Best Doctor 2020-2023; Excellence in Patient Care Award Winner.", expected: null, description: "Valid: Semicolons and hyphens over 50 chars" },
  { input: "Skills: Surgery, Diagnosis, Treatment Planning, Patient Care, etc.", expected: null, description: "Valid: Commas over 50 chars" },
  { input: "Contact: doctor@hospital.com | Office: Room #302 | Available M-F", expected: null, description: "Valid: Pipe and hash over 50 chars" },
  
  // Valid inputs - long text
  { input: "A".repeat(999), expected: null, description: "Valid: 999 characters" },
  { input: "A".repeat(1000), expected: null, description: "Valid: Exactly 1000 characters (maximum)" },
  
  // Valid inputs - multiline text
  { input: "Line 1 is here with some text\nLine 2 has more content\nLine 3 ends it all nicely", expected: null, description: "Valid: Multiline with newlines over 50 chars" },
  { input: "Paragraph 1 has a lot of interesting medical information here.\n\nParagraph 2 continues with more details.", expected: null, description: "Valid: Multiple paragraphs over 50 chars" },
  
  // Invalid inputs - too long
  { input: "A".repeat(1001), expected: 'Bio must not exceed 1000 characters', description: "Invalid: 1001 characters (exceeds maximum)" },
  { input: "A".repeat(1500), expected: 'Bio must not exceed 1000 characters', description: "Invalid: 1500 characters" },
  { input: "A".repeat(2000), expected: 'Bio must not exceed 1000 characters', description: "Invalid: 2000 characters" },
  
  // Invalid inputs - HTML tags
  { input: "<p>I am a doctor with many years of experience in medicine</p>", expected: 'Bio cannot contain HTML tags or scripts', description: "Invalid: Contains <p> tag" },
  { input: "I am a <b>great</b> doctor with extensive experience in cardiology", expected: 'Bio cannot contain HTML tags or scripts', description: "Invalid: Contains <b> tag" },
  { input: "Education: <div>Harvard Medical School, graduated with honors in 2005</div>", expected: 'Bio cannot contain HTML tags or scripts', description: "Invalid: Contains <div> tag" },
  { input: "<span>Doctor with 15 years of experience in internal medicine</span>", expected: 'Bio cannot contain HTML tags or scripts', description: "Invalid: Contains <span> tag" },
  { input: "I am a doctor <br> with experience in treating various conditions", expected: 'Bio cannot contain HTML tags or scripts', description: "Invalid: Contains <br> tag" },
  { input: "I am a doctor <br/> with experience in pediatric and family care", expected: 'Bio cannot contain HTML tags or scripts', description: "Invalid: Contains <br/> tag" },
  { input: "<h1>Dr. Smith - Board Certified Physician with 20 years experience</h1>", expected: 'Bio cannot contain HTML tags or scripts', description: "Invalid: Contains <h1> tag" },
  { input: "Contact: <a href='mailto:doctor@example.com'>Email me for appointments</a>", expected: 'Bio cannot contain HTML tags or scripts', description: "Invalid: Contains <a> tag" },
  { input: "<img src='photo.jpg'> This is my professional photo from last year", expected: 'Bio cannot contain HTML tags or scripts', description: "Invalid: Contains <img> tag" },
  { input: "<input type='text'> Please enter your medical history in this field", expected: 'Bio cannot contain HTML tags or scripts', description: "Invalid: Contains <input> tag" },
  
  // Invalid inputs - script tags
  { input: "<script>alert('xss')</script> This is a malicious bio with script injection", expected: 'Bio cannot contain HTML tags or scripts', description: "Invalid: Contains <script> tag" },
  { input: "Bio text here with some content <script>malicious code</script> and more text", expected: 'Bio cannot contain HTML tags or scripts', description: "Invalid: Contains script tag in middle" },
  { input: "<SCRIPT>alert('XSS')</SCRIPT> Attempting uppercase script tag injection here", expected: 'Bio cannot contain HTML tags or scripts', description: "Invalid: Uppercase <SCRIPT> tag" },
  { input: "<ScRiPt>code</ScRiPt> Mixed case script tag with some other text content", expected: 'Bio cannot contain HTML tags or scripts', description: "Invalid: Mixed case script tag" },
  
  // Invalid inputs - partial script tags
  { input: "I am <script a doctor with many years of experience in medicine", expected: 'Bio cannot contain HTML tags or scripts', description: "Invalid: Contains '<script'" },
  { input: "I am a doctor with experience in various specialties </script>", expected: 'Bio cannot contain HTML tags or scripts', description: "Invalid: Contains '</script>'" },
  
  // Valid inputs - text that looks like tags but isn't (mathematical operators separated)
  { input: "Use formula: a<5 or b>10 when calculating patient dosages correctly", expected: null, description: "Valid: Mathematical operators without spaces" },
  { input: "Cost is $100 <-- great deal for medical equipment and supplies", expected: null, description: "Valid: Arrow with < symbol" },
  { input: "Rating: 5/5 stars >>> Excellent reviews from my many patients", expected: null, description: "Valid: Greater than symbols" },
  
  // Edge cases
  { input: "   ", expected: null, description: "Valid: Only whitespace (not empty after trim in component)" },
  { input: "\n\n\n", expected: null, description: "Valid: Only newlines" },
];

// Run tests
console.log('Running bio validation tests...\n');
let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = validateBio(test.input);
  const success = result === test.expected;
  
  if (success) {
    passed++;
    console.log(`✓ Test ${index + 1}: ${test.description}`);
  } else {
    failed++;
    console.log(`✗ Test ${index + 1}: ${test.description}`);
    console.log(`  Input: "${test.input?.substring(0, 50)}${test.input?.length > 50 ? '...' : ''}"`);
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
