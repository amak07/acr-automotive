---
title: "SKU Search Format Guide"
---

# SKU Search Format Guide

> **Purpose**: User-facing guide explaining supported SKU search formats
>
> **Audience**: Parts counter staff, end users
> **Last Updated**: November 8, 2025

---

## Overview

ACR Automotive's search system accepts SKUs in **any format**. You don't need to worry about:

- ✅ Hyphens or spaces
- ✅ Upper or lowercase letters
- ✅ Special characters
- ✅ ACR prefix (we'll add it automatically!)

**Just type the SKU however you remember it**, and we'll find the part.

---

## ✨ What Formats Work?

### ACR Part Numbers

All these searches find the same part (`ACR-15002`):

```
ACR-15002     ← Standard format (hyphen)
ACR 15002     ← With spaces
acr-15002     ← Lowercase
acr 15002     ← Lowercase with spaces
ACRBR001      ← No spaces or hyphens
15002         ← Without ACR prefix (we add it!)
BR-001        ← Partial without prefix
ACR#15002     ← With special characters
```

**All of these will find your part!**

---

### Competitor Part Numbers

Search with competitor SKUs in any format:

```
TM-512348      ← Timken with hyphen
tm 512348      ← Lowercase with spaces
TM512348       ← No spaces
Timken-512348  ← Full brand name
```

**We'll find the matching ACR part via cross-reference.**

---

### Partial Searches

Don't remember the full SKU? No problem!

```
1500    → Finds ACR-15002, ACR-15003, ACR-15004, ...
BR      → Finds all brake parts (ACR-BR-001, ACR-BR-002, ...)
5123    → Finds competitor SKUs containing "5123"
```

---

## 🎯 Search Tips

### Shorthand Searches

**Forget "ACR"?** We'll add it automatically:

```
Search: 15002
Result: Finds ACR-15002 ✅
```

### Brand Prefixes

**Include brand names** for competitor parts:

```
Timken-512348  → Finds ACR equivalent
TM-512348      → Also works!
```

### Partial Matching

**Searching for a family of parts?** Use partial numbers:

```
BR-00  → Finds ACR-BR-001, ACR-BR-002, ACR-BR-003, ...
1500   → Finds all parts with "1500" in the SKU
```

---

## 📊 Match Quality

Search results show **match quality** to help you identify the best match:

### Exact Match (100% confidence)

- ✅ You searched: `ACR-15002`
- ✅ Found: `ACR-15002` (exact match)

### Prefix Added (95% confidence)

- ✅ You searched: `15002` (missing ACR)
- ✅ Found: `ACR-15002` (we added "ACR" for you)

### Partial Match (90% confidence)

- ✅ You searched: `1500`
- ✅ Found: Multiple parts (`ACR-15002`, `ACR-15003`, ...)

### Competitor Cross-Reference (100% confidence)

- ✅ You searched: `TM-512348` (competitor SKU)
- ✅ Found: `ACR-BR-001` (via cross-reference)

### Fuzzy Match (60-90% confidence)

- ✅ You searched: `ACR-BR-01` (typo - missing last digit)
- ✅ Found: `ACR-BR-001` (similarity: 91%)

**Higher confidence = better match!**

---

## 🔍 Examples from Real Use Cases

### Example 1: Customer Has Competitor Part

**Customer says**: "I need a replacement for Timken TM-512348"

**You search**: `TM-512348` or `tm 512348` or `TM512348`

**Result**: ACR-BR-001 (100% match via cross-reference)

---

### Example 2: Customer Only Has Part of SKU

**Customer says**: "It's an ACR brake part, number starts with BR-00"

**You search**: `BR-00`

**Result**: List of all ACR brake parts (ACR-BR-001, ACR-BR-002, ACR-BR-003, ...)

---

### Example 3: Customer Forgot ACR Prefix

**Customer says**: "It's part number 15002"

**You search**: `15002`

**Result**: ACR-15002 (95% match - we added "ACR" prefix)

---

### Example 4: Customer Has Typo

**Customer says**: "ACR-BR-01" (missing last digit)

**You search**: `ACR-BR-01`

**Result**: ACR-BR-001 (91% fuzzy match - close enough!)

---

## ⚡ Performance

**Search speed**: Under 300 milliseconds (usually ~150ms)

**Search strategies** (automatic fallback):

1. Exact normalized match (~50-100ms)
2. With ACR prefix added (~50-100ms)
3. Partial match (~100-150ms)
4. Competitor cross-reference (~100-150ms)
5. Fuzzy typo matching (~150-180ms)

**You don't need to think about this** - the system handles it automatically!

---

## 🚫 What Doesn't Work

These edge cases may not return accurate results:

- **Unicode characters**: `ACR-🚗-001` (use alphanumeric only)
- **SQL injection attempts**: `ACR'; DROP TABLE parts;--` (security filtered)
- **Empty searches**: ` ` (whitespace only)

---

## 📱 Mobile Searching

**Works perfectly on phones and tablets!**

- Type naturally (autocorrect won't break search)
- No need to fiddle with hyphens on mobile keyboards
- Search works the same on all devices

---

## 🎓 Training Tips for Counter Staff

### Quick Reference Card

| Customer Says                  | You Type    | Result            |
| ------------------------------ | ----------- | ----------------- |
| "TM-512348"                    | `tm 512348` | ✅ ACR-BR-001     |
| "ACR fifteen thousand two"     | `15002`     | ✅ ACR-15002      |
| "Brake part, BR double-oh-one" | `br001`     | ✅ ACR-BR-001     |
| "Part number starts with 1500" | `1500`      | ✅ Multiple parts |

### Common Mistakes (That Still Work!)

- ❌ "I forgot the hyphen" → ✅ Still works!
- ❌ "I typed lowercase" → ✅ Still works!
- ❌ "I forgot ACR" → ✅ We add it!
- ❌ "I made a typo" → ✅ Fuzzy search finds it!

### Pro Tips

1. **Start specific, go broader**: Try exact SKU first, then partial if needed
2. **Use competitor numbers**: Often faster than looking up ACR equivalent
3. **Don't overthink formatting**: Just type what you see
4. **Check match quality**: Higher % = better match

---

## 🔗 Related Documentation

- **[SEARCH_SYSTEM.md](./SEARCH_SYSTEM.md)** - Technical implementation details
- **[DATABASE.md](../../database/DATABASE.md)** - Migration 009 database changes
- **[TESTING.md](../../TESTING.md)** - How we test SKU normalization

---

## ❓ Frequently Asked Questions

### Q: Do I need to type hyphens?

**A**: No! `ACR-15002` and `ACR15002` and `acr 15002` all work the same.

---

### Q: What if I don't know the full ACR SKU?

**A**: Use partial search! Type `1500` to find all parts with "1500" in the number.

---

### Q: Can I search with lowercase?

**A**: Yes! `acr-br-001` and `ACR-BR-001` are identical to the system.

---

### Q: What if I make a typo?

**A**: Our fuzzy search finds similar SKUs automatically (with a similarity score).

---

### Q: Can I search competitor part numbers?

**A**: Absolutely! Enter any competitor SKU (Timken, Raybestos, etc.) and we'll find the ACR equivalent.

---

### Q: What if the system can't find my part?

**A**: Try:

1. Partial search (fewer characters)
2. Check for typos
3. Try competitor SKU instead
4. Contact support if part truly doesn't exist

---

**Remember**: Our search is designed to be **forgiving and flexible**. Just type naturally and we'll find your part! 🚀
