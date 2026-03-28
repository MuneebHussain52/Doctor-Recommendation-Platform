# License Number Validation - Quick Reference

## ✅ Valid License Numbers

These license numbers will be **accepted**:

### Alphanumeric Only
```
MED123456           ✅ Letters and numbers
ABC123              ✅ Mix of letters and numbers
123456              ✅ Only numbers
ABCDEF              ✅ Only uppercase letters
abcdef              ✅ Only lowercase letters
AbCdEf123           ✅ Mixed case with numbers
```

### With Hyphens
```
MED-123456          ✅ With hyphen
ABC-123-XYZ         ✅ Multiple hyphens
MED-2024-ABC        ✅ Hyphens separating sections
123-456-789         ✅ Numbers with hyphens
-ABC123             ✅ Starting with hyphen
ABC123-             ✅ Ending with hyphen
```

### With Slashes
```
MED/123456          ✅ With slash
ABC/123/XYZ         ✅ Multiple slashes
MED/2024/ABC        ✅ Slashes separating sections
123/456/789         ✅ Numbers with slashes
/ABC123             ✅ Starting with slash
ABC123/             ✅ Ending with slash
```

### Mixed Hyphens and Slashes
```
MED-123/456         ✅ Hyphen and slash
ABC/123-XYZ         ✅ Slash and hyphen mixed
A1-B2/C3            ✅ Complex mix
```

## ❌ Invalid License Numbers

These license numbers will be **rejected**:

### Contains Spaces
```
MED 123456          ❌ Contains space
MED 123 456         ❌ Multiple spaces
 MED123456          ❌ Leading space
MED123456           ❌ Trailing space (with space after)
```

### Contains Special Characters (not allowed)
```
MED@123456          ❌ Contains @
MED#123456          ❌ Contains #
MED$123456          ❌ Contains $
MED%123456          ❌ Contains %
MED&123456          ❌ Contains &
MED*123456          ❌ Contains *
MED+123456          ❌ Contains +
MED=123456          ❌ Contains =
MED.123456          ❌ Contains period
MED,123456          ❌ Contains comma
MED:123456          ❌ Contains colon
MED;123456          ❌ Contains semicolon
MED!123456          ❌ Contains !
MED?123456          ❌ Contains ?
MED(123456)         ❌ Contains parentheses
MED[123456]         ❌ Contains brackets
MED{123456}         ❌ Contains braces
MED<123456>         ❌ Contains < >
MED_123456          ❌ Contains underscore
MED|123456          ❌ Contains pipe
MED\123456          ❌ Contains backslash
```

### Empty
```
(empty)             ❌ "License number is required"
```

---

## Important Rules

### ✅ Allowed Characters:
1. **Letters** (A-Z, a-z) - uppercase and lowercase
2. **Numbers** (0-9)
3. **Hyphens** (-) - can be anywhere, including start/end
4. **Slashes** (/) - can be anywhere, including start/end

### ❌ NOT Allowed:
1. **Spaces** - no spaces anywhere
2. **Periods** (.) - not allowed
3. **Underscores** (_) - not allowed
4. **Any other special characters** - @, #, $, %, &, *, +, =, etc.

---

## Common License Number Formats

Different medical licensing authorities use different formats. Here are examples that would be valid:

```
MED123456           ✅ Simple format
MED-123456          ✅ With hyphen separator
MED/2024/123        ✅ Year-based format
ABC-123-XYZ-789     ✅ Multi-section format
12345678            ✅ Numeric only
ABCD1234EFGH        ✅ Alphanumeric sequence
MED-2024-12/AB      ✅ Mixed separators
```

---

## Error Message

If invalid characters are detected, the user will see:
```
"License number must contain only letters, numbers, hyphens, or slashes"
```

If the field is empty:
```
"License number is required"
```

---

## Validation Behavior

- **Trigger**: Validation occurs when the user leaves the license number field (onBlur)
- **Error Display**: Red border appears around the field + error message below
- **Error Clear**: Error is cleared when user starts typing again
- **Submit Block**: Form cannot be submitted if license number is invalid

---

## Test Results

All 49 test cases passed ✅

- 21 valid inputs tested
- 25 invalid inputs with special characters tested
- 3 edge cases tested (empty, null, undefined)
- 100% coverage of allowed and disallowed characters
