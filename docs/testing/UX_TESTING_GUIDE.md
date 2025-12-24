---
title: "UX Testing Guide - ACR Automotive"
---

# UX Testing Guide - ACR Automotive

> **Purpose**: Manual testing procedures for user experience, accessibility, and browser compatibility
> **Last Updated**: November 4, 2025
> **Status**: Active

## Table of Contents

1. [Overview](#1-overview)
2. [Quick Reference Checklist](#2-quick-reference-checklist)
3. [Import Wizard Flow Testing](#3-import-wizard-flow-testing)
4. [File Upload Experience Testing](#4-file-upload-experience-testing)
5. [Validation Step Testing](#5-validation-step-testing)
6. [Diff Preview Testing](#6-diff-preview-testing)
7. [Accessibility Testing](#7-accessibility-testing)
8. [Browser Compatibility Testing](#8-browser-compatibility-testing)
9. [Performance Testing](#9-performance-testing)
10. [Error Recovery Testing](#10-error-recovery-testing)
11. [Database Cleanup Best Practices](#11-database-cleanup-best-practices)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Overview

This guide covers **manual testing procedures** for the Import Wizard UI/UX. While automated tests (262 passing, 100% component coverage) validate functionality, manual testing ensures real-world usability, accessibility, and cross-browser compatibility.

### Integration with Automated Testing

```
Automated Tests (Jest/React Testing Library)
├── Unit Tests: Business logic (ValidationEngine, DiffEngine, etc.)
├── Component Tests: UI rendering (ImportStep1, ImportStep2, etc.)
└── Integration Tests: Full pipeline (parse → validate → diff → import)

Manual UX Tests (This Guide)  ← YOU ARE HERE
├── Real browser testing (not jsdom simulation)
├── Accessibility validation (WCAG 2.1 AA)
├── Cross-browser compatibility (6 browsers)
└── Real user workflows (not synthetic test data)
```

### When to Run Manual UX Tests

| Scenario                   | Frequency                     | Time Required |
| -------------------------- | ----------------------------- | ------------- |
| **Pre-release testing**    | Before each production deploy | 2-4 hours     |
| **After major UI changes** | Wizard flow modifications     | 1-2 hours     |
| **New browser support**    | Adding iOS/Safari support     | 2 hours       |
| **Accessibility audits**   | Quarterly                     | 1 hour        |
| **Performance regression** | When tests slow down          | 30 minutes    |

### Who Should Run These Tests

- **QA Engineers**: Complete checklist before release
- **Developers**: Spot-check after UI changes
- **Product Owners**: Validate UX meets requirements
- **Accessibility Specialists**: WCAG compliance verification

---

## 2. Quick Reference Checklist

### Pre-Release Testing (15 Items)

Use this checklist before each production deployment:

#### Import Wizard Flow

- [ ] Happy path: Upload → Validate → Review → Confirm → Success
- [ ] Error path: Invalid file → Clear error message → Re-upload works
- [ ] Warning path: Data changes → Acknowledge warnings → Import succeeds

#### File Upload

- [ ] Drag-and-drop works (visual feedback on hover)
- [ ] File size validation (10MB limit, clear error if exceeded)
- [ ] File type validation (.xlsx only, helpful error for .csv/.xls)
- [ ] Large file progress (1000+ parts show progress indicator)

#### Validation & Diff

- [ ] Error messages include row/column/value (not just error code)
- [ ] Warnings show before/after values
- [ ] Cascade delete warnings require acknowledgment
- [ ] Pagination works (20 items → Load More → Show All)

#### Accessibility

- [ ] Keyboard navigation (Tab through wizard, Enter to advance)
- [ ] Screen reader announces errors/warnings
- [ ] Focus visible on all interactive elements

#### Browser Compatibility

- [ ] Chrome Desktop: All features work
- [ ] iPad Safari: File upload + touch interactions work

**PASS CRITERIA**: All 15 items checked ✅

---

## 3. Import Wizard Flow Testing

### Test Scenario 3.1: Happy Path (No Errors)

**Objective**: Verify complete import workflow for valid file

**Test Data**: `fixtures/excel/unit/valid-add-new-parts.xlsx` (5 parts, no errors)

**Steps**:

1. Navigate to `/admin/import`
2. **Step 1 - Upload**:
   - Drag file onto drop zone
   - **Expected**: Drop zone highlights on hover, file name appears, "Parsing..." message
   - **Expected**: "Validation Successful" message appears within 2 seconds
3. **Step 2 - Validation**:
   - **Expected**: Green checkmark icon, "No errors found" message
   - **Expected**: "Next" button enabled (blue, not gray)
   - Click "Next"
4. **Step 3 - Diff Preview**:
   - **Expected**: Summary shows "5 new parts, 0 updates, 0 deletes"
   - **Expected**: "Adds" section expanded by default, shows 5 parts
   - **Expected**: Each part shows ACR_SKU, Part_Type, Position_Type
   - Click "Next"
5. **Step 4 - Confirmation**:
   - **Expected**: Confirmation message "Ready to import 5 new parts"
   - Click "Import"
   - **Expected**: "Importing..." spinner appears
   - **Expected**: "Import Complete" success message within 2 seconds
   - **Expected**: "View Imported Parts" link visible

**Success Criteria**:

- ✅ No errors or warnings displayed
- ✅ Each step transitions smoothly (no flicker/flash)
- ✅ Import completes in <2 seconds
- ✅ Success message includes import summary (5 parts added)

**Failure Scenarios**:

- ❌ Validation takes >5 seconds
- ❌ "Next" button enabled before validation completes
- ❌ Diff preview shows incorrect counts
- ❌ Import fails with transaction error

---

### Test Scenario 3.2: Error Path (Validation Errors)

**Objective**: Verify error handling and recovery workflow

**Test Data**: `fixtures/excel/unit/error-missing-required-fields.xlsx` (3 errors)

**Steps**:

1. Upload file with validation errors
2. **Step 2 - Validation**:
   - **Expected**: Red X icon, "3 errors found" message
   - **Expected**: Errors grouped by sheet ("Parts (3 errors)")
   - **Expected**: Click to expand error list
   - **Expected**: Each error shows:
     - Error code badge (E1, E3)
     - Row number ("Row 2")
     - Column name ("ACR_SKU is required")
     - Specific value (if applicable)
   - **Expected**: "Next" button disabled (gray)
3. Download file, fix errors in Excel, save
4. Re-upload fixed file
   - **Expected**: Previous file selection cleared
   - **Expected**: New validation starts automatically
   - **Expected**: "Validation Successful" if errors fixed

**Success Criteria**:

- ✅ Error messages are understandable to non-technical users
- ✅ Row numbers match Excel (2-indexed, accounting for header row)
- ✅ Re-upload works without refreshing page
- ✅ Previous validation state cleared on new upload

---

### Test Scenario 3.3: Warning Path (Data Changes)

**Objective**: Verify warning acknowledgment workflow

**Test Data**: `fixtures/excel/unit/warning-data-changes.xlsx` (5 warnings)

**Steps**:

1. Upload file with data changes
2. **Step 2 - Validation**:
   - **Expected**: Yellow warning icon, "Validation successful with warnings"
   - **Expected**: "5 warnings" count displayed
   - **Expected**: Warnings section shows before/after values:
     ```
     ACR_SKU changed from "SEED-001" to "SEED-001-CHANGED"
     ```
   - **Expected**: Checkbox "I acknowledge these changes" (unchecked by default)
   - **Expected**: "Next" button enabled (warnings don't block progress)
3. Click "Next" without acknowledging warnings
   - **Expected**: Warnings persist to Diff Preview step
   - **Expected**: Diff shows UPDATE operation for changed parts
4. Return to Step 2, check acknowledgment checkbox
   - **Expected**: Checkbox state persists during navigation

**Success Criteria**:

- ✅ Warnings don't block import (Next button enabled)
- ✅ Before/after values clearly displayed
- ✅ Acknowledgment checkbox optional but encouraged
- ✅ Warning state persists across step navigation

---

### Test Scenario 3.4: Step Navigation (Back Button)

**Objective**: Verify state preservation when navigating backward

**Steps**:

1. Complete Steps 1-3 (Upload → Validation → Diff Preview)
2. On Step 3 (Diff Preview), click "Back" button
   - **Expected**: Returns to Step 2 (Validation)
   - **Expected**: Validation results still displayed (not re-validated)
3. Click "Back" again
   - **Expected**: Returns to Step 1 (Upload)
   - **Expected**: Uploaded file name still displayed
4. Click "Next" to advance
   - **Expected**: Skips validation (uses cached results)
   - **Expected**: Proceeds directly to Step 2

**Success Criteria**:

- ✅ Back navigation doesn't trigger re-validation
- ✅ Uploaded file state preserved
- ✅ Diff results cached (not recalculated)
- ✅ No data loss during navigation

---

### Test Scenario 3.5: Browser Refresh (State Preservation)

**Objective**: Verify behavior when user refreshes browser mid-wizard

**Steps**:

1. Upload file and reach Step 2 (Validation complete)
2. Press F5 or Cmd+R to refresh browser
   - **Expected**: Wizard resets to Step 1
   - **Expected**: Uploaded file state lost
   - **Expected**: No errors/crashes

**Success Criteria**:

- ✅ Wizard gracefully resets to initial state
- ✅ No JavaScript errors in console
- ✅ User can start new import immediately

**Alternative Behavior** (Future Enhancement):

- ⚠️ Save wizard state to localStorage
- ⚠️ Restore state after refresh
- ⚠️ Show "Continue previous import?" prompt

---

### Test Scenario 3.6: Browser Back Button

**Objective**: Verify behavior when user presses browser back button

**Steps**:

1. Navigate to `/admin/import`
2. Upload file, complete Step 2
3. Press browser Back button (not wizard "Back" button)
   - **Expected**: Returns to `/admin/dashboard` (previous page)
   - **Expected**: Import state lost
4. Navigate forward using browser Forward button
   - **Expected**: Returns to `/admin/import`
   - **Expected**: Wizard reset to Step 1

**Success Criteria**:

- ✅ Browser back button behaves predictably
- ✅ No errors when returning to import page
- ✅ Wizard state doesn't persist across browser navigation

---

### Test Scenario 3.7: Cancel/Exit Workflow

**Objective**: Verify user can safely exit wizard

**Steps**:

1. Upload file, reach Step 3
2. Click "Cancel" button
   - **Expected**: Confirmation modal: "Are you sure? Progress will be lost."
   - **Expected**: "Cancel" (stay) and "Exit" (leave) buttons
3. Click "Cancel" in modal (stay in wizard)
   - **Expected**: Modal closes, remains on Step 3
4. Click "Cancel" button again, then "Exit" in modal
   - **Expected**: Returns to `/admin/dashboard`
   - **Expected**: Import state cleared

**Success Criteria**:

- ✅ Confirmation modal prevents accidental exit
- ✅ "Cancel" terminology clear (Cancel import vs Cancel modal)
- ✅ Exit navigation works correctly
- ✅ State cleaned up after exit

---

## 4. File Upload Experience Testing

### Test Scenario 4.1: Drag-and-Drop Interaction

**Objective**: Verify drag-and-drop usability and visual feedback

**Steps**:

1. Open `/admin/import` in browser
2. Open file explorer, locate `valid-add-new-parts.xlsx`
3. **Drag file** over drop zone (DON'T release yet)
   - **Expected**: Drop zone changes appearance (border highlight, background color change)
   - **Expected**: Cursor changes to "copy" icon
4. **Release file** (drop)
   - **Expected**: Drop zone returns to normal appearance
   - **Expected**: File name appears: "valid-add-new-parts.xlsx"
   - **Expected**: "Parsing..." loading indicator appears
5. **Drag invalid file type** (e.g., .pdf)
   - **Expected**: Drop zone rejects file
   - **Expected**: Error message: "Only .xlsx files are supported"

**Success Criteria**:

- ✅ Visual feedback clear during drag (hover state)
- ✅ Drop animation smooth (no flicker)
- ✅ File type validation before parsing
- ✅ Error message helpful and specific

---

### Test Scenario 4.2: Click to Upload

**Objective**: Verify traditional file picker works as alternative to drag-drop

**Steps**:

1. Click "Browse files" button in drop zone
   - **Expected**: Native file picker opens
   - **Expected**: File picker filtered to .xlsx files only (if browser supports)
2. Select file from picker
   - **Expected**: Same behavior as drag-drop (file name, parsing)
3. Click "Browse files" again (replace file)
   - **Expected**: Can select different file
   - **Expected**: Previous file selection replaced

**Success Criteria**:

- ✅ File picker opens correctly
- ✅ File type filter applied (Excel files only)
- ✅ Re-selection works without page refresh

---

### Test Scenario 4.3: File Size Validation (10MB Limit)

**Objective**: Verify large file rejection with helpful error message

**Test Data**: Create 11MB file (or use `large-dataset.xlsx` if >10MB)

**Steps**:

1. Attempt to upload file >10MB
   - **Expected**: File rejected BEFORE parsing begins
   - **Expected**: Error message displayed:
     ```
     File too large (11.2 MB). Maximum file size is 10 MB.
     Please split your import into smaller batches.
     ```
   - **Expected**: Link to documentation about file size limits

**Success Criteria**:

- ✅ File size checked immediately (not after upload)
- ✅ Error message includes actual file size and limit
- ✅ Helpful suggestion provided (split into batches)
- ✅ Help link navigates to correct documentation

**Edge Case**: File exactly 10MB

- **Expected**: Accepted (inclusive limit)

---

### Test Scenario 4.4: File Type Validation

**Objective**: Verify clear error messages for wrong file types

**Test Files**:

- `test.xls` (old Excel format)
- `test.csv` (comma-separated values)
- `test.txt` (plain text)
- `test.pdf` (PDF)

**Steps**:

1. **Upload .xls file**
   - **Expected**: Error: "Old Excel format (.xls) not supported. Please save as .xlsx."
2. **Upload .csv file**
   - **Expected**: Error: "CSV files not supported. Convert to Excel (.xlsx) format first."
   - **Expected**: Link to CSV import documentation (if available)
3. **Upload .txt or .pdf**
   - **Expected**: Error: "Invalid file type. Only Excel files (.xlsx) are supported."

**Success Criteria**:

- ✅ File type detected before parsing
- ✅ Error messages specific to file type (not generic)
- ✅ Helpful recovery suggestions provided
- ✅ Links to relevant documentation

---

### Test Scenario 4.5: Corrupted File Handling

**Objective**: Verify graceful handling of corrupted Excel files

**Test Data**: Create corrupted .xlsx file (rename .txt to .xlsx, or corrupt valid file)

**Steps**:

1. Upload corrupted file
   - **Expected**: Parsing fails with clear error
   - **Expected**: Error message:
     ```
     File appears to be corrupted or invalid.
     Please re-download the file from the export system and try again.
     If the problem persists, contact support.
     ```
   - **Expected**: No JavaScript console errors
   - **Expected**: Wizard remains functional (can upload different file)

**Success Criteria**:

- ✅ Corruption detected during parsing
- ✅ Error message non-technical (no stack traces shown to user)
- ✅ Recovery suggestion clear (re-export file)
- ✅ Wizard doesn't crash (error boundary catches exception)

---

### Test Scenario 4.6: Network Timeout During Upload

**Objective**: Verify timeout handling for large file uploads

**Simulation**: Use browser DevTools to throttle network to "Slow 3G"

**Steps**:

1. Open DevTools → Network tab → Set throttling to "Slow 3G"
2. Upload 5MB file
   - **Expected**: Progress indicator shows upload in progress
   - **Expected**: If upload takes >30 seconds, timeout message:
     ```
     Upload is taking longer than expected.
     This may be due to a slow network connection.
     [Cancel] [Keep Waiting]
     ```
3. Click "Cancel"
   - **Expected**: Upload aborted, can try again
4. Retry upload, click "Keep Waiting"
   - **Expected**: Upload continues

**Success Criteria**:

- ✅ Timeout threshold reasonable (30s)
- ✅ User can cancel long-running upload
- ✅ User can choose to wait longer
- ✅ Retry works after cancellation

---

### Test Scenario 4.7: Large File Progress Indicator

**Objective**: Verify progress feedback for files with 1000+ parts

**Test Data**: `fixtures/excel/scenarios/01-quarterly-update.xlsx` (50 parts minimum)

**Steps**:

1. Upload file with 1000+ parts (or largest available fixture)
2. During parsing:
   - **Expected**: Progress bar or spinner visible
   - **Expected**: Status message: "Parsing... 250 of 1000 rows"
   - **Expected**: Updates every 100ms or so
3. If parsing takes >5 seconds:
   - **Expected**: Time estimate: "~2 minutes remaining"
   - **Expected**: Cancel button available

**Success Criteria**:

- ✅ Progress indicator appears for operations >1 second
- ✅ Progress updates incrementally (not just spinner)
- ✅ Time estimate reasonably accurate
- ✅ User can cancel long-running operations

---

### Test Scenario 4.8: File Upload on Mobile/Tablet

**Objective**: Verify file upload works on iPad Safari (primary device)

**Device**: iPad (iOS Safari)

**Steps**:

1. Navigate to `/admin/import` on iPad
2. Tap "Browse files" button
   - **Expected**: iOS file picker opens
   - **Expected**: Can select from Files app or iCloud Drive
3. Select file from Files app
   - **Expected**: File uploads successfully
   - **Expected**: Progress indicator visible
4. **Drag-and-drop test**:
   - **Expected**: May not work on iOS (drag-drop limited)
   - **Expected**: Graceful fallback to file picker button

**Success Criteria**:

- ✅ File picker works on iOS
- ✅ Upload completes successfully
- ✅ Drag-drop disabled gracefully (no error)
- ✅ UI responsive on tablet screen size

---

## 5. Validation Step Testing

### Test Scenario 5.1: Error Message Clarity (E1-E23)

**Objective**: Verify all error codes display helpful, actionable messages

**Test Data**: `fixtures/excel/unit/error-*.xlsx` files

#### E1: Missing Hidden Columns

```
File does not contain hidden ID columns.
Please export from the system first before importing.

→ Row: N/A
→ How to fix: Navigate to Export page, download fresh file, edit that file
```

**Verify**:

- ✅ Message explains WHAT is wrong
- ✅ Message explains WHY (must export first)
- ✅ Message explains HOW to fix

#### E2: Duplicate ACR_SKU

```
Duplicate ACR_SKU "ACR-001" found in file

→ Row: 5
→ Column: ACR_SKU
→ Value: ACR-001
→ How to fix: Remove duplicate row or change SKU to unique value
```

**Verify**:

- ✅ Shows which SKU is duplicated
- ✅ Shows row number where duplicate found
- ✅ Suggests recovery action

#### E3: Empty Required Field

```
ACR_SKU is required

→ Row: 3
→ Column: ACR_SKU
→ Value: (empty)
→ How to fix: Enter a valid SKU value in this cell
```

**Verify**:

- ✅ Shows which field is required
- ✅ Shows exact location (row/column)
- ✅ Explains field cannot be empty

#### E4: Invalid UUID Format

```
Invalid UUID format: "invalid-uuid-format"

→ Row: 2
→ Column: _id
→ How to fix: This usually means the file was manually created.
             Re-export from the system to get valid IDs.
```

**Verify**:

- ✅ Shows invalid value
- ✅ Explains likely cause (manual file creation)
- ✅ Provides recovery steps (re-export)

#### E5: Orphaned Foreign Key

```
ACR_SKU "ACR-999" does not reference any part in the Parts sheet

→ Row: 15
→ Sheet: Vehicle_Applications
→ How to fix: Either add part "ACR-999" in Parts sheet (must come before this row)
             or check for typos in the SKU
```

**Verify**:

- ✅ Shows which SKU is missing
- ✅ Identifies referencing sheet
- ✅ Provides TWO recovery options

#### E6: Invalid Year Range

```
End_Year (2020) cannot be before Start_Year (2025)

→ Row: 8
→ Columns: Start_Year, End_Year
→ How to fix: Ensure End_Year >= Start_Year or leave End_Year empty
```

**Verify**:

- ✅ Shows both year values
- ✅ Explains the constraint
- ✅ Suggests valid input

**Test All 23 Error Codes**:

- [ ] E1 - Missing hidden columns
- [ ] E2 - Duplicate ACR_SKU
- [ ] E3 - Empty required field
- [ ] E4 - Invalid UUID
- [ ] E5 - Orphaned foreign key
- [ ] E6 - Invalid year range
- [ ] E7 - Max length exceeded
- [ ] E8 - Year out of range
- [ ] ... (continue for all 23)

**Success Criteria**:

- ✅ All error messages include row number
- ✅ All error messages explain HOW to fix
- ✅ Language understandable to non-developers
- ✅ No technical jargon (UUIDs explained as "IDs")

---

### Test Scenario 5.2: Warning Display (W1-W12)

**Objective**: Verify warnings show before/after values clearly

**Test Data**: `fixtures/excel/unit/warning-data-changes.xlsx`

#### W1: ACR_SKU Changed

```
⚠️ ACR_SKU changed

Before: SEED-001
After:  SEED-001-CHANGED

→ Row: 2
→ Impact: This will update the SKU for this part
```

**Verify**:

- ✅ Before value clearly labeled
- ✅ After value clearly labeled
- ✅ Impact explained
- ✅ Visual alignment (Before/After stacked vertically)

#### W7: Specifications Shortened

```
⚠️ Specifications shortened

Before: "Front brake rotor for Honda Civic 2010-2015. Drilled and slotted for improved performance..."
        (150 characters)
After:  "Front brake rotor for Honda Civic 2010-2015. Drilled and slotted..."
        (70 characters - 53% reduction)

→ Row: 5
→ Impact: Description will be truncated
```

**Verify**:

- ✅ Shows full before/after text (truncated with ...)
- ✅ Shows character counts
- ✅ Shows percentage reduction
- ✅ Warns about data loss

**Test All 12 Warning Codes**:

- [ ] W1 - ACR_SKU changed
- [ ] W2 - Year range narrowed
- [ ] W3 - Part type changed
- [ ] W4 - Position type changed
- [ ] W5 - Quantity changed
- [ ] W6 - Part deleted (cascade warning)
- [ ] W7 - Specifications shortened
- [ ] ... (continue for all 12)

**Success Criteria**:

- ✅ Before/after values always shown
- ✅ Warnings don't block import (informational only)
- ✅ Acknowledgment checkbox optional but encouraged
- ✅ Visual distinction from errors (yellow vs red)

---

### Test Scenario 5.3: Sheet-Level Grouping

**Objective**: Verify errors organized by sheet for easy navigation

**Test Data**: Create file with errors in all 3 sheets

**Expected UI**:

```
Parts (5 errors)
  [Expand/Collapse]
  → E2: Duplicate ACR_SKU "ACR-001" (Row 3)
  → E3: Part_Type is required (Row 5)
  → E7: Part_Name exceeds max length (Row 7)
  → ...

Vehicle_Applications (3 errors)
  [Expand/Collapse]
  → E5: Orphaned reference "ACR-999" (Row 12)
  → E6: Invalid year range (Row 15)
  → ...

Cross_References (2 errors)
  [Expand/Collapse]
  → E5: Orphaned reference "ACR-888" (Row 20)
  → ...
```

**Interactions**:

1. Click "Parts (5 errors)"
   - **Expected**: Expands to show 5 error details
   - **Expected**: Icon changes (▶ to ▼)
2. Click again to collapse
   - **Expected**: Error list hidden
3. All sheets collapsed by default?
   - **Verify**: What's the default state (all expanded vs all collapsed)

**Success Criteria**:

- ✅ Errors grouped by sheet name
- ✅ Error count per sheet displayed in header
- ✅ Expand/collapse works smoothly
- ✅ Visual hierarchy clear (sheet > errors)

---

### Test Scenario 5.4: Multi-Error on Single Row

**Objective**: Verify handling when one row has 5+ errors

**Test Data**: Create row with multiple errors (empty SKU, invalid UUID, orphaned FK, max length, year range)

**Expected UI**:

```
Row 10 has 5 errors:
  1. E3: ACR_SKU is required
  2. E4: Invalid UUID format for _id
  3. E5: Orphaned reference to part
  4. E7: Part_Name exceeds 200 character limit
  5. E8: Start_Year out of valid range

[Show Details] [Collapse]
```

**Interactions**:

1. **Expected**: Multiple errors on same row grouped together
2. **Expected**: Row number prominently displayed
3. **Expected**: Errors listed in severity order (E3 before E8)
4. Click "Show Details"
   - **Expected**: Expands to show full error messages with columns/values

**Success Criteria**:

- ✅ Row-level grouping when 3+ errors on same row
- ✅ Error count shown ("5 errors")
- ✅ Can expand/collapse details
- ✅ Doesn't overwhelm user with long error list

---

### Test Scenario 5.5: Pagination (Errors/Warnings)

**Objective**: Verify pagination for files with 50+ errors

**Test Data**: Create file with 100 validation errors

**Expected Behavior**:

```
Parts (100 errors)
  Showing 1-10 of 100

  [Error 1]
  [Error 2]
  ...
  [Error 10]

  [Load 10 more] [Show all 100]
```

**Interactions**:

1. **Default**: Show first 10 errors
2. Click "Load 10 more"
   - **Expected**: Shows errors 1-20
   - **Expected**: Button updates: "Showing 1-20 of 100"
3. Click "Show all 100"
   - **Expected**: All errors displayed
   - **Expected**: Button changes to "Collapse" or disappears
4. Scroll behavior:
   - **Expected**: Scrollable list (not infinite scroll to bottom of page)

**Success Criteria**:

- ✅ Initial load shows 10-20 errors (not overwhelming)
- ✅ Pagination clear and intuitive
- ✅ "Show all" option available for power users
- ✅ List remains scrollable (doesn't break page layout)

---

### Test Scenario 5.6: Warning Acknowledgment Checkbox

**Objective**: Verify acknowledgment checkbox behavior

**Test Data**: File with 5 warnings

**Steps**:

1. View validation results with warnings
   - **Expected**: Checkbox "I acknowledge these changes" (unchecked)
   - **Expected**: Checkbox below warning list
2. Click "Next" without checking box
   - **Expected**: Proceeds to Step 3 (warnings optional)
3. Check the acknowledgment checkbox
   - **Expected**: Checkbox state saved
4. Navigate to Step 3, then back to Step 2
   - **Expected**: Checkbox remains checked
5. Uncheck and navigate forward
   - **Expected**: Checkbox state persists as unchecked

**Success Criteria**:

- ✅ Checkbox clearly labeled
- ✅ State persists during wizard navigation
- ✅ Acknowledgment optional (doesn't block import)
- ✅ Callback fires when checkbox toggled (for analytics)

---

## 6. Diff Preview Testing

### Test Scenario 6.1: Add Operations Display

**Objective**: Verify new parts display clearly in Adds section

**Test Data**: `fixtures/excel/unit/valid-add-new-parts.xlsx` (5 new parts)

**Expected UI**:

```
Summary: 5 adds, 0 updates, 0 deletes

Adds (5) [Collapse]
  [+] ACR-001 - Brake Rotor - Front
      Type: Rotor, Position: Front
      Specifications: Front brake rotor for Honda Civic...

  [+] ACR-002 - Brake Pad - Rear
      Type: Pad, Position: Rear
      ...
```

**Interactions**:

1. **Default**: Adds section expanded
2. Each part shows:
   - ✅ Plus icon (green)
   - ✅ ACR_SKU prominently displayed
   - ✅ Part_Type and Position_Type
   - ✅ Specifications preview (truncated)
3. Click on part
   - **Expected**: Expands to show all fields
   - **Expected**: Properties displayed in table format

**Success Criteria**:

- ✅ Green color coding for adds
- ✅ Part details readable at a glance
- ✅ Expand/collapse works per part
- ✅ Summary count matches parts shown (5 adds = 5 parts)

---

### Test Scenario 6.2: Update Operations Display

**Objective**: Verify field-level change detection for updates

**Test Data**: File with 1 updated part (Part_Type changed from Rotor to Pad)

**Expected UI**:

```
Updates (1) [Collapse]
  [✏️] ACR-001 - Brake Rotor → Brake Pad

      Changes:
      • Part_Type: Rotor → Pad
      • Specifications: Shortened (150 → 70 chars)

      Unchanged:
      • Position_Type: Front
      • Properties: {diameter: 12.5, width: 1.25}
```

**Interactions**:

1. **Expected**: Pencil/edit icon (yellow/orange)
2. **Expected**: Changes section lists modified fields only
3. **Expected**: Before → After arrows clearly displayed
4. **Expected**: Unchanged fields collapsed by default
5. Click "Show unchanged fields"
   - **Expected**: Expands to show all fields

**Success Criteria**:

- ✅ Only changed fields shown by default
- ✅ Before → After format clear
- ✅ Can view all fields (changed + unchanged)
- ✅ Visual distinction from Adds (yellow vs green)

---

### Test Scenario 6.3: Delete Operations Display

**Objective**: Verify delete operations clearly show what will be removed

**Test Data**: File with 1 deleted part (remove ACR-001 from export)

**Expected UI**:

```
Deletes (1) [Collapse]
  [🗑️] ACR-001 - Brake Rotor - Front
       Type: Rotor, Position: Front

       ⚠️ This will also delete:
       • 5 vehicle applications
       • 3 cross-references

       [Show affected records]
```

**Interactions**:

1. **Expected**: Trash icon (red)
2. **Expected**: Part details shown (what will be deleted)
3. **Expected**: Cascade delete warning if relationships exist
4. Click "Show affected records"
   - **Expected**: Lists vehicle applications and cross-refs that will be deleted
   - **Expected**: Shows vehicle details (Make, Model, Year)

**Success Criteria**:

- ✅ Red color coding for deletes
- ✅ Cascade delete impact clearly shown
- ✅ Can view affected related records
- ✅ Warning message prominent (not hidden)

---

### Test Scenario 6.4: Pagination (20 Items at a Time)

**Objective**: Verify pagination for large import with 100+ changes

**Test Data**: Create file with 100 new parts

**Expected UI**:

```
Adds (100) [Collapse]
  Showing 1-20 of 100

  [+] ACR-001 ...
  [+] ACR-002 ...
  ...
  [+] ACR-020 ...

  [Load 20 more] [Show all 100]
```

**Interactions**:

1. **Default**: Show 20 items
2. Click "Load 20 more"
   - **Expected**: Shows items 1-40
   - **Expected**: Smooth scroll (no jump to top)
3. Click "Show all 100"
   - **Expected**: All 100 items displayed
   - **Expected**: List scrollable within section
4. **Independent pagination**:
   - **Expected**: Adds, Updates, Deletes paginated separately
   - **Expected**: Expanding one section doesn't affect others

**Success Criteria**:

- ✅ Pagination prevents UI lag (only render 20 at a time)
- ✅ "Load more" smooth (no flash/reload)
- ✅ "Show all" available for power users
- ✅ Each section (Adds/Updates/Deletes) independent

---

### Test Scenario 6.5: Cascade Delete Warnings

**Objective**: Verify cascade delete warnings require acknowledgment

**Test Data**: Delete part that has 50 vehicle applications

**Expected UI**:

```
⚠️ Warning: Cascade Deletes

Deleting 1 part will also delete:
• 50 vehicle applications
• 23 cross-references

This action cannot be undone. The related records will be permanently removed.

[ ] I understand these records will be deleted

[Show affected records]
```

**Interactions**:

1. **Expected**: Warning displayed prominently above Deletes section
2. **Expected**: Counts shown (50 vehicle apps, 23 cross-refs)
3. **Expected**: Checkbox "I understand..." (unchecked by default)
4. Click "Next" without acknowledging
   - **Expected**: Error/warning: "Please acknowledge cascade deletes"
   - **Expected**: Cannot proceed to confirmation step
5. Check acknowledgment box
   - **Expected**: "Next" button enabled
6. Click "Show affected records"
   - **Expected**: Modal or expandable list showing:
     - ACR_SKU of part being deleted
     - Make/Model/Year of affected vehicles
     - Competitor brands of affected cross-refs

**Success Criteria**:

- ✅ Cascade warning impossible to miss
- ✅ Impact quantified (50 apps, 23 refs)
- ✅ Acknowledgment required (blocks progress)
- ✅ Can preview affected records before confirming

---

## 7. Accessibility Testing

### WCAG 2.1 Level AA Compliance Checklist

#### 7.1 Keyboard Navigation

**Objective**: Verify all functionality accessible via keyboard only (no mouse)

**Test Procedure**:

1. **Tab order**:
   - [ ] Tab through entire wizard in logical order
   - [ ] Focus indicator visible on all interactive elements
   - [ ] Tab order matches visual layout (top to bottom, left to right)
   - [ ] Skip links available for long content (optional)

2. **Step navigation**:
   - [ ] Tab to "Next" button, press Enter → Advances to next step
   - [ ] Tab to "Back" button, press Enter → Returns to previous step
   - [ ] Tab to "Cancel" button, press Enter → Shows exit confirmation

3. **File upload**:
   - [ ] Tab to "Browse files" button, press Enter → Opens file picker
   - [ ] File picker navigable with keyboard (OS-dependent)

4. **Error/Warning lists**:
   - [ ] Tab to expand/collapse buttons, press Enter → Toggles section
   - [ ] Arrow keys navigate within error list (optional enhancement)

5. **Checkboxes**:
   - [ ] Tab to warning acknowledgment checkbox, press Space → Toggles checked state

6. **Escape key**:
   - [ ] Press Esc in modal → Closes modal (if applicable)
   - [ ] Press Esc in wizard → No effect (or shows exit confirmation)

**Success Criteria**:

- ✅ All functionality accessible without mouse
- ✅ Focus order logical and predictable
- ✅ Focus indicator clearly visible (not browser default only)

---

#### 7.2 Screen Reader Compatibility

**Tools**: NVDA (Windows), JAWS (Windows), VoiceOver (Mac/iOS)

**Test Procedure**:

1. **Headings and landmarks**:
   - [ ] Page has proper heading hierarchy (H1 → H2 → H3)
   - [ ] Wizard steps marked as landmarks (`role="region"` or `<section>`)
   - [ ] Screen reader announces step number ("Step 1 of 4")

2. **Form labels**:
   - [ ] File input has associated label ("Upload Excel file")
   - [ ] Checkbox has label ("I acknowledge these warnings")
   - [ ] Error messages associated with form fields (`aria-describedby`)

3. **Live regions**:
   - [ ] Validation results announced when ready (`aria-live="polite"`)
   - [ ] Error count announced ("3 errors found")
   - [ ] Import success/failure announced (`role="alert"`)

4. **Button labels**:
   - [ ] "Next" button labeled appropriately ("Next step: Validation")
   - [ ] "Back" button labeled ("Previous step: Upload")
   - [ ] Icon-only buttons have `aria-label` (expand/collapse icons)

5. **Status messages**:
   - [ ] "Parsing file..." announced during upload
   - [ ] "Validation successful" announced on completion
   - [ ] "Importing..." announced during import execution

**Test with Screen Reader**:

1. Navigate wizard from start to finish using only screen reader
2. Verify all content readable
3. Verify all actions performable
4. Verify status changes announced

**Success Criteria**:

- ✅ All content accessible to screen reader
- ✅ All actions performable with screen reader commands
- ✅ Status changes announced automatically
- ✅ No "unlabeled button" or "clickable" announcements

---

#### 7.3 Color Contrast

**Tool**: WebAIM Contrast Checker, browser DevTools

**Test Procedure**:

1. **Error text** (red):
   - [ ] Error code badge: Contrast ratio ≥ 4.5:1 (white text on red background)
   - [ ] Error message text: Contrast ratio ≥ 4.5:1 (red text on white background)

2. **Warning text** (yellow/orange):
   - [ ] Warning badge: Contrast ratio ≥ 4.5:1
   - [ ] Warning message text: Contrast ratio ≥ 4.5:1

3. **Success text** (green):
   - [ ] Success badge: Contrast ratio ≥ 4.5:1
   - [ ] "Validation successful" text: Contrast ratio ≥ 4.5:1

4. **Interactive elements**:
   - [ ] Button text: Contrast ratio ≥ 4.5:1
   - [ ] Link text: Contrast ratio ≥ 4.5:1
   - [ ] Focus indicator: Contrast ratio ≥ 3:1 (against background)

5. **Disabled elements**:
   - [ ] Disabled button: Clearly distinguishable but not ≥ 4.5:1 (WCAG exemption)

**Success Criteria**:

- ✅ All text meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
- ✅ Interactive elements distinguishable
- ✅ No reliance on color alone (icons + text for errors/warnings/success)

---

#### 7.4 Focus Management

**Objective**: Verify focus moves logically during interactions

**Test Procedure**:

1. **Modal dialogs**:
   - [ ] When modal opens, focus moves to modal (first focusable element)
   - [ ] Tab trapped within modal (cannot Tab to background content)
   - [ ] When modal closes, focus returns to trigger element (button that opened modal)

2. **Error messages**:
   - [ ] When validation fails, focus moves to first error (optional enhancement)
   - [ ] Screen reader announces error count

3. **Step navigation**:
   - [ ] When advancing step, focus moves to step heading or first interactive element
   - [ ] When going back, focus returns to previous step's first element

4. **Success messages**:
   - [ ] When import succeeds, focus moves to success message
   - [ ] "View Imported Parts" link focusable

**Success Criteria**:

- ✅ Focus never lost (always on a focusable element)
- ✅ Focus movements logical and expected
- ✅ Modal focus trapping works correctly

---

#### 7.5 ARIA Attributes

**Objective**: Verify proper use of ARIA roles and attributes

**Test Procedure** (Use browser DevTools Accessibility Inspector):

1. **Wizard steps**:
   - [ ] Step indicator uses `aria-current="step"` for active step
   - [ ] Completed steps marked `aria-current="false"` or no attribute
   - [ ] Future steps not clickable (`aria-disabled="true"` or `disabled`)

2. **Expand/collapse sections**:
   - [ ] Buttons use `aria-expanded="true|false"`
   - [ ] Expandable sections have `id` matching button's `aria-controls`

3. **Error/warning lists**:
   - [ ] Error container has `role="alert"` or `aria-live="assertive"` (on appearance)
   - [ ] Warning container has `aria-live="polite"`

4. **Progress indicators**:
   - [ ] Progress bar/spinner has `role="progressbar"` (if determinate)
   - [ ] Indeterminate spinner has `role="status"` and `aria-live="polite"`

5. **Validation status**:
   - [ ] "Validation successful" has `role="status"` or `aria-live="polite"`
   - [ ] "3 errors found" has `role="alert"` or `aria-live="assertive"`

**Success Criteria**:

- ✅ ARIA attributes used appropriately (not overused)
- ✅ Roles match visual presentation
- ✅ Live regions announce changes correctly

---

## 8. Browser Compatibility Testing

### Compatibility Matrix

Test all features across 6 browsers × 8 features = 48 test points

| Feature                  | Chrome Desktop | Firefox Desktop | Safari Desktop | Edge Desktop | iOS Safari | iPad Safari |
| ------------------------ | -------------- | --------------- | -------------- | ------------ | ---------- | ----------- |
| **File upload (click)**  | ✅             | ✅              | ✅             | ✅           | ✅         | ✅          |
| **Drag-and-drop upload** | ✅             | ✅              | ⚠️             | ✅           | ❌         | ⚠️          |
| **File type validation** | ✅             | ✅              | ✅             | ✅           | ✅         | ✅          |
| **Excel parsing**        | ✅             | ✅              | ✅             | ✅           | ✅         | ✅          |
| **Validation display**   | ✅             | ✅              | ✅             | ✅           | ✅         | ✅          |
| **Diff preview**         | ✅             | ✅              | ✅             | ✅           | ✅         | ✅          |
| **Import execution**     | ✅             | ✅              | ✅             | ✅           | ✅         | ✅          |
| **Rollback**             | ✅             | ✅              | ✅             | ✅           | ✅         | ✅          |

**Legend**:

- ✅ Fully supported, tested, working
- ⚠️ Partially supported (known limitations documented)
- ❌ Not supported (graceful degradation)

---

### Browser-Specific Tests

#### 8.1 Chrome Desktop (Priority: HIGH)

**Primary development browser** - Most features developed here first

**Test Focus**:

- [ ] All wizard steps work flawlessly
- [ ] No console errors
- [ ] Performance benchmarks met (<2s import)
- [ ] DevTools Accessibility audit passes

---

#### 8.2 Firefox Desktop (Priority: MEDIUM)

**Test Focus**:

- [ ] File drag-and-drop works (Firefox has stricter security)
- [ ] Excel parsing works (ArrayBuffer handling)
- [ ] CSS Grid layout correct (occasionally differs from Chrome)
- [ ] Focus indicators visible (default Firefox styles different)

**Known Issues**:

- None currently documented

---

#### 8.3 Safari Desktop (Priority: MEDIUM)

**Test Focus**:

- [ ] File upload works (Safari file picker differences)
- [ ] Drag-and-drop visual feedback works (Safari has stricter drag events)
- [ ] Date/time display correct (Safari date formatting)
- [ ] Web APIs supported (FileReader, Blob, etc.)

**Known Issues**:

- Drag-and-drop may require additional hover state handling

---

#### 8.4 Edge Desktop (Priority: LOW)

**Test Focus**:

- [ ] All features work (Edge is Chromium-based, should match Chrome)
- [ ] No Edge-specific UI quirks

**Known Issues**:

- None expected (Chromium-based)

---

#### 8.5 iOS Safari (Priority: MEDIUM)

**Test Focus**:

- [ ] File upload from Files app works
- [ ] Touch interactions work (tap vs click)
- [ ] Scrolling smooth (no bounce issues)
- [ ] Viewport sizing correct (notch handling)

**Known Issues**:

- Drag-and-drop NOT supported (iOS limitation) - Graceful fallback to file picker button

**Expected Behavior**:

- [ ] "Drag file here" text changes to "Tap to select file" on iOS
- [ ] File picker opens on tap
- [ ] No errors when drag-drop unavailable

---

#### 8.6 iPad Safari (Priority: **HIGHEST**)

**Primary device** for parts counter staff per PLANNING.md

**Test Focus**:

- [ ] File upload from Files app/iCloud Drive works
- [ ] Touch target sizes ≥ 44×44px (Apple guidelines)
- [ ] Landscape orientation works
- [ ] Split-screen multitasking works (if applicable)
- [ ] Keyboard navigation works (if external keyboard connected)
- [ ] Large file upload (5MB) works reliably

**Special Attention**:

- iPad is the **PRIMARY DEVICE** - All features must work flawlessly
- Test with actual iPad Pro (not just browser resize)
- Test with both wifi and cellular data (if applicable)

**Known Issues**:

- Drag-and-drop may be limited - Provide clear "Tap to select file" fallback

---

### Cross-Browser Testing Checklist

**Before Release**:

- [ ] Chrome Desktop: Full feature test (30 minutes)
- [ ] Firefox Desktop: Smoke test (15 minutes)
- [ ] Safari Desktop: Smoke test (15 minutes)
- [ ] iPad Safari: **Full feature test** (45 minutes) ← **CRITICAL**
- [ ] iOS Safari: Smoke test (15 minutes)
- [ ] Edge Desktop: Smoke test (10 minutes - optional)

**Total Time**: ~2.5 hours for comprehensive cross-browser testing

---

## 9. Performance Testing

### Performance Benchmarks (from PLANNING.md)

Target: **Sub-300ms search response times**, **<2s import execution**

| Operation              | Target             | Measurement                         | Test File         |
| ---------------------- | ------------------ | ----------------------------------- | ----------------- |
| **File parsing**       | <2s for 1000 parts | Upload → "Parsing complete"         | 1000-part fixture |
| **Validation**         | <500ms             | "Validating..." → Results displayed | Any valid file    |
| **Diff generation**    | <300ms             | Validation → Diff displayed         | Any file          |
| **Import execution**   | <2s per docs       | "Importing..." → "Success"          | 1000-part fixture |
| **Rollback execution** | <2s per docs       | "Rolling back..." → "Complete"      | After import      |

---

### Test Scenario 9.1: Small File Performance (5 Parts)

**Test Data**: `fixtures/excel/unit/valid-add-new-parts.xlsx` (5 parts)

**Procedure**:

1. Open browser DevTools → Performance tab → Start recording
2. Upload file
3. Stop recording when validation completes
4. Analyze timeline

**Expected Results**:

- Parsing: <200ms
- Validation: <100ms
- Diff generation: <50ms
- Total (upload to validation complete): <500ms

**Success Criteria**:

- ✅ Total time <500ms
- ✅ No long tasks >50ms (no UI freeze)
- ✅ No memory leaks (memory returns to baseline)

---

### Test Scenario 9.2: Medium File Performance (50 Parts)

**Test Data**: `fixtures/excel/scenarios/01-quarterly-update.xlsx` (50 parts)

**Expected Results**:

- Parsing: <500ms
- Validation: <300ms
- Diff generation: <200ms
- Import execution: <1s
- Total: <2s

**Success Criteria**:

- ✅ Total time <2s
- ✅ Progress indicator appears (operation >500ms)
- ✅ UI remains responsive (can click Cancel)

---

### Test Scenario 9.3: Large File Performance (1000+ Parts)

**Test Data**: Generate 1000-part Excel file

**Expected Results**:

- Parsing: <2s
- Validation: <500ms
- Diff generation: <300ms
- Import execution: <5s (adjusted for large file)
- Rollback: <5s

**Success Criteria**:

- ✅ Parsing <2s
- ✅ Progress indicator shown with incremental updates
- ✅ Time estimate displayed ("~2 minutes remaining")
- ✅ No browser "Page unresponsive" warning

**If Performance Degrades**:

- [ ] Check for N+1 queries in validation logic
- [ ] Verify diff algorithm efficiency
- [ ] Profile with Chrome DevTools Performance tab
- [ ] Consider chunking/batching for very large files

---

### Test Scenario 9.4: Network Performance (Slow Connection)

**Objective**: Verify performance on slow network (3G)

**Procedure**:

1. Open DevTools → Network tab → Throttle to "Slow 3G"
2. Navigate to `/admin/import`
3. Upload 5MB file

**Expected Results**:

- File upload progress indicator shown
- Upload completes (may take 30-60 seconds)
- Timeout handling if >60 seconds
- Clear status messages ("Uploading... 2MB of 5MB")

**Success Criteria**:

- ✅ Upload doesn't fail on slow connection
- ✅ Progress feedback clear
- ✅ Timeout threshold reasonable (60s minimum)
- ✅ User can cancel long upload

---

## 10. Error Recovery Testing

### Test Scenario 10.1: Re-Upload After Validation Errors

**Objective**: Verify user can fix errors and re-upload seamlessly

**Steps**:

1. Upload file with 3 validation errors
2. View errors on Step 2
3. Download file, fix errors in Excel, save
4. Re-upload fixed file (without refreshing browser)
   - **Expected**: Previous validation state cleared
   - **Expected**: New validation starts automatically
   - **Expected**: If errors fixed, "Validation successful" shown
5. Click "Next" to proceed to Step 3

**Success Criteria**:

- ✅ Re-upload works without page refresh
- ✅ Previous errors cleared (not appended to new errors)
- ✅ New validation uses new file data
- ✅ User can proceed if errors fixed

---

### Test Scenario 10.2: Import After Rollback

**Objective**: Verify import works after rolling back previous import

**Steps**:

1. Execute import successfully
2. Navigate to Import History or Settings
3. Click "Rollback" on recent import
4. Confirm rollback
5. Navigate back to Import page
6. Upload same file again
   - **Expected**: No errors about duplicate data
   - **Expected**: Diff shows ADDS (not UNCHANGED)
   - **Expected**: Import succeeds again

**Success Criteria**:

- ✅ Rollback restores database to previous state
- ✅ Subsequent import treats data as new (not duplicate)
- ✅ Import succeeds without errors

---

### Test Scenario 10.3: Browser Refresh During Import

**Objective**: Verify graceful handling of refresh during import execution

**Steps**:

1. Upload file, complete validation and diff preview
2. Click "Import" button
3. **Immediately** refresh browser (F5 / Cmd+R) while "Importing..." message displayed
   - **Expected**: Import transaction may complete or rollback (depending on timing)
   - **Expected**: On page reload, wizard reset to Step 1
   - **Expected**: No corrupt database state

4. Check import history
   - **Scenario A**: Import completed before refresh → History shows successful import
   - **Scenario B**: Import interrupted → No partial data, transaction rolled back

**Success Criteria**:

- ✅ No corrupt data in database (atomic transaction respected)
- ✅ Wizard resets gracefully
- ✅ User can start new import immediately
- ✅ No JavaScript errors in console

---

### Test Scenario 10.4: Network Interruption During Import

**Objective**: Verify handling of network failure during import

**Simulation**: Use DevTools to simulate offline mode during import

**Steps**:

1. Upload file, reach confirmation step
2. Open DevTools → Network tab → Set to "Offline"
3. Click "Import"
   - **Expected**: Import fails with network error
   - **Expected**: Error message: "Import failed due to network error. Please check your connection and try again."
   - **Expected**: "Retry" button available

4. Set network back to "Online"
5. Click "Retry"
   - **Expected**: Import executes successfully

**Success Criteria**:

- ✅ Network failure detected
- ✅ Error message clear and actionable
- ✅ Retry option available
- ✅ Import doesn't leave partial data

---

### Test Scenario 10.5: Concurrent Import Prevention

**Objective**: Verify system prevents two simultaneous imports

**Steps**:

1. Open import wizard in two browser tabs
2. Tab 1: Upload file, complete validation, click "Import"
3. Tab 2: While Tab 1 importing, upload different file and try to import
   - **Expected**: Tab 2 shows error or warning
   - **Expected**: Message: "An import is already in progress. Please wait for it to complete or rollback the previous import."
   - **Expected**: Import button disabled in Tab 2

4. Wait for Tab 1 import to complete
5. Refresh Tab 2
   - **Expected**: Can now import new file

**Success Criteria**:

- ✅ Concurrent imports prevented (database lock or application-level check)
- ✅ Clear error message explaining why import blocked
- ✅ Suggestion to wait or rollback previous import
- ✅ No data corruption from concurrent access

---

## 11. Database Cleanup Best Practices

### Overview

Integration tests that modify the database must clean up after themselves to ensure **test isolation**. Without cleanup, tests leave residual data that affects subsequent test runs, causing flakiness and false positives/negatives.

### Current Cleanup Gaps

| Test File                      | Database Impact                   | Cleanup Status | Risk   |
| ------------------------------ | --------------------------------- | -------------- | ------ |
| `rollback-edge-cases.test.ts`  | Creates imports & snapshots       | ❌ NONE        | HIGH   |
| `concurrent-import.test.ts`    | Creates parts, imports, history   | ❌ NONE        | HIGH   |
| `large-dataset.test.ts`        | Disabled (would create 10k parts) | N/A            | LOW    |
| `test-full-import-pipeline.ts` | Full import + rollback            | ⚠️ PARTIAL     | MEDIUM |

---

### Recommended Pattern: afterEach Hook

**Use Case**: Integration tests that execute imports

```typescript
import { RollbackService } from "@/services/excel/rollback/RollbackService";

describe("Import Integration Test", () => {
  // Track all imports for cleanup
  const importTracker = {
    ids: [] as string[],

    track(importId: string) {
      this.ids.push(importId);
    },

    async cleanup() {
      const rollbackService = new RollbackService();
      for (const importId of this.ids) {
        try {
          await rollbackService.rollbackToImport(importId);
          console.log(`✅ Cleaned up import ${importId}`);
        } catch (error: any) {
          // Import may already be rolled back or deleted
          console.warn(`⚠️  Could not cleanup ${importId}:`, error.message);
        }
      }
      this.ids = [];
    },
  };

  // Cleanup after each test
  afterEach(async () => {
    await importTracker.cleanup();
  });

  // Final safety cleanup
  afterAll(async () => {
    await importTracker.cleanup();
  });

  it("should import data successfully", async () => {
    const importService = new ImportService();

    // Execute import
    const result = await importService.executeImport(parsed, diff, metadata);

    // IMPORTANT: Track import ID for cleanup
    importTracker.track(result.importId);

    // Run test assertions
    expect(result.summary.totalChanges).toBeGreaterThan(0);

    // Cleanup happens automatically in afterEach
  });
});
```

---

### Pattern: Cleanup on Test Failure

**Use Case**: Ensure cleanup even if test throws error

```typescript
it("should handle validation errors", async () => {
  let importId: string | null = null;

  try {
    const result = await importService.executeImport(invalidData);
    importId = result.importId;

    // Test assertions...
    expect(result.summary.errors).toBeGreaterThan(0);
  } catch (error) {
    // Test failed - cleanup before re-throwing
    if (importId) {
      await rollbackService.rollbackToImport(importId);
    }
    throw error; // Re-throw to fail test
  } finally {
    // Always cleanup (success or failure)
    if (importId) {
      await rollbackService.rollbackToImport(importId);
    }
  }
});
```

---

### Pattern: Concurrent Import Cleanup

**Use Case**: Tests that execute multiple imports in parallel

```typescript
describe("Concurrent Import Test", () => {
  const createdImports: string[] = [];

  afterEach(async () => {
    // Cleanup any successful imports
    if (createdImports.length > 0) {
      const rollbackService = new RollbackService();
      console.log(`\n🧹 Cleaning up ${createdImports.length} test imports...`);

      for (const importId of createdImports) {
        try {
          await rollbackService.rollbackToImport(importId);
        } catch (error: any) {
          console.warn(`⚠️  Cleanup warning for ${importId}:`, error.message);
        }
      }

      createdImports.length = 0; // Clear array
      console.log("✅ Cleanup complete\n");
    }
  });

  it("should handle concurrent imports", async () => {
    const results = await Promise.allSettled([
      importService1.executeImport(data1),
      importService2.executeImport(data2),
    ]);

    // Track successful imports for cleanup
    results.forEach((result, idx) => {
      if (result.status === "fulfilled" && result.value?.importId) {
        createdImports.push(result.value.importId);
        console.log(`✅ Import ${idx + 1} succeeded: ${result.value.importId}`);
      }
    });

    // Test assertions...
  });
});
```

---

### Best Practices

1. **Always Track Import IDs**
   - Every test that executes `importService.executeImport()` must track the returned `importId`
   - Use array or Set to accumulate IDs during test execution

2. **Use Rollback Service for Cleanup**
   - Don't manually delete records (`DELETE FROM parts WHERE ...`)
   - Use `rollbackService.rollbackToImport(importId)` which atomically restores database state
   - Rollback is faster and safer than manual cleanup

3. **Cleanup in afterEach AND afterAll**
   - `afterEach`: Clean up after each test (test isolation)
   - `afterAll`: Safety net in case afterEach fails
   - Both should be idempotent (safe to run multiple times)

4. **Handle Cleanup Errors Gracefully**
   - Don't fail test if cleanup fails
   - Use `try/catch` and log warnings
   - Import may already be rolled back by test logic

5. **Log Cleanup Activity**
   - Console.log cleanup start/end for debugging
   - Show which imports were cleaned up
   - Helps diagnose test flakiness

---

### Integration Test Checklist

Before merging integration tests, verify:

- [ ] Test tracks all import IDs created
- [ ] `afterEach` hook cleans up database changes
- [ ] `afterAll` hook provides safety net
- [ ] Cleanup handles errors gracefully (try/catch)
- [ ] Cleanup logged for debugging
- [ ] Test passes when run in isolation
- [ ] Test passes when run after other tests (no contamination)

---

## 12. Troubleshooting

### Issue: Drag-and-Drop Not Working

**Symptoms**:

- File drop zone doesn't respond to drag
- No visual feedback on hover
- File doesn't upload after drop

**Causes & Solutions**:

1. **Browser doesn't support drag-drop** (iOS Safari):
   - **Solution**: Use file picker button fallback
   - **Verify**: Fallback message shown ("Tap to select file" instead of "Drag file here")

2. **CORS policy blocking file access**:
   - **Check**: Browser console for CORS errors
   - **Solution**: Not applicable for local file upload (no CORS)

3. **Event handlers not attached**:
   - **Check**: Browser console for JavaScript errors
   - **Verify**: `onDragOver`, `onDragLeave`, `onDrop` handlers registered

4. **File type restriction**:
   - **Check**: Are you dragging .xlsx file?
   - **Try**: Drag a valid .xlsx file, not .csv or .txt

---

### Issue: Validation Takes Too Long (>5s)

**Symptoms**:

- "Validating..." message hangs
- No progress indicator
- Browser becomes unresponsive

**Causes & Solutions**:

1. **File too large** (>1000 parts):
   - **Check**: File size and row count
   - **Solution**: Implement chunking/batching for large files
   - **Workaround**: Split import into smaller batches

2. **Inefficient validation algorithm**:
   - **Check**: Browser DevTools Performance tab for long tasks
   - **Solution**: Profile ValidationEngine, optimize N+1 queries

3. **Network timeout**:
   - **Check**: Network tab for stalled requests
   - **Solution**: Increase timeout threshold or implement client-side validation caching

---

### Issue: Error Messages Not Displaying

**Symptoms**:

- Validation fails but no errors shown
- Error count shows 0 despite validation failure
- UI stuck on validation step

**Causes & Solutions**:

1. **Error response parsing failed**:
   - **Check**: Browser console for JSON parsing errors
   - **Verify**: API returns errors in expected format: `{ valid: false, errors: [...] }`

2. **UI component not rendering errors**:
   - **Check**: React DevTools for component state
   - **Verify**: `validationResult.errors` array populated

3. **Error messages missing translations**:
   - **Check**: Console for i18n missing key warnings
   - **Verify**: All error codes (E1-E23) have translation entries

---

### Issue: Import Fails with "Transaction Error"

**Symptoms**:

- "Importing..." completes with error
- Error message: "Transaction failed after 3 attempts"
- Database unchanged (no data imported)

**Causes & Solutions**:

1. **Duplicate SKU in database** (constraint violation):
   - **Check**: Error message mentions "idx_parts_sku_tenant"
   - **Solution**: Validation should have caught this - file a bug
   - **Workaround**: Check existing database for duplicate SKUs

2. **Foreign key violation**:
   - **Check**: Error mentions "foreign key constraint"
   - **Cause**: Orphaned vehicle application or cross-reference
   - **Solution**: Validation should prevent this - file a bug

3. **Database connection lost**:
   - **Check**: Network tab for failed database requests
   - **Solution**: Retry import, check database connection

---

### Issue: Rollback Doesn't Restore Data

**Symptoms**:

- Rollback succeeds but data not restored
- Import history snapshot empty
- Parts count incorrect after rollback

**Causes & Solutions**:

1. **Snapshot not created during import**:
   - **Check**: Import history record has `snapshot_data` field populated
   - **Cause**: Snapshot creation failed silently
   - **Solution**: Check import logs, verify snapshot creation step

2. **Sequential rollback enforcement**:
   - **Error**: "Must rollback newest import first"
   - **Cause**: Trying to rollback old import while newer imports exist
   - **Solution**: Rollback imports in reverse chronological order (newest first)

3. **Snapshot data corrupted**:
   - **Check**: Import history record, verify snapshot_data is valid JSON
   - **Solution**: If corrupted, cannot recover - use database backup

---

### Issue: Browser "Page Unresponsive" Warning

**Symptoms**:

- Browser warns "Page is not responding"
- UI freezes during parsing or validation
- Cannot interact with wizard

**Causes & Solutions**:

1. **File too large** (>5000 parts):
   - **Solution**: Implement Web Workers for parsing/validation
   - **Workaround**: Split file into smaller batches

2. **Synchronous operations blocking UI thread**:
   - **Solution**: Make parsing/validation asynchronous
   - **Fix**: Add `await` and `Promise` to long operations

3. **Infinite loop in validation logic**:
   - **Check**: Browser console for repeated log messages
   - **Solution**: File bug with reproduction steps

---

### How to Report UX Bugs

When reporting UX issues, include:

1. **Steps to reproduce**:
   - Exact sequence of actions
   - Test file used (or attach file)
   - Browser and version

2. **Expected behavior**:
   - What should happen

3. **Actual behavior**:
   - What actually happens
   - Include screenshots or screen recording

4. **Browser console logs**:
   - Any errors or warnings in console
   - Network tab for failed requests

5. **Browser environment**:
   - Browser: Chrome 118, Firefox 119, Safari 17, etc.
   - OS: Windows 11, macOS 14, iOS 17, etc.
   - Device: Desktop, iPad Pro 12.9", iPhone 15, etc.

**Example Bug Report**:

```
Title: Drag-and-drop not working on iPad Safari

Steps to Reproduce:
1. Navigate to /admin/import on iPad Safari (iOS 17)
2. Drag valid-add-new-parts.xlsx from Files app
3. Drop onto drop zone

Expected: File uploads and parsing begins
Actual: No response, drop zone doesn't accept file

Browser: Safari 17.1 (iOS 17.0.3)
Device: iPad Pro 12.9" (2022)
Console: No errors

Notes: File picker button works as workaround
```

---

## Summary

This UX testing guide covers **manual testing procedures** that complement the automated test suite (262 passing tests). Use this guide before production releases to validate:

- ✅ Import Wizard user flows (happy path + error recovery)
- ✅ File upload experience (drag-drop, validation, progress)
- ✅ Error/warning message clarity
- ✅ Diff preview usability
- ✅ Accessibility (WCAG 2.1 AA compliance)
- ✅ Browser compatibility (6 browsers, iPad Safari priority)
- ✅ Performance benchmarks (<2s import)
- ✅ Database cleanup (test isolation)

**Time Commitment**:

- Pre-release testing: 2-4 hours
- Quick smoke test: 30 minutes (Chrome + iPad Safari only)

**Next Steps**:

1. Bookmark this guide for pre-release testing
2. Create manual testing checklist in project management tool
3. Assign QA engineer for release validation
4. Track browser compatibility issues in issue tracker
5. Update guide as new features added

For questions or suggestions, contact development team or file issue in project repository.

---

**Last Updated**: November 4, 2025
**Document Version**: 1.0
**Maintained By**: Development Team
