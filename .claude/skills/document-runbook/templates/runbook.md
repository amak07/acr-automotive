---
title: [Process Name] Runbook
description: Step-by-step guide for [brief description]
---

# [Process Name] Runbook

## Overview

| Property           | Value                            |
| ------------------ | -------------------------------- |
| **Purpose**        | [What this runbook accomplishes] |
| **When to use**    | [Triggers for this procedure]    |
| **Estimated time** | [How long this typically takes]  |
| **Risk level**     | Low / Medium / High              |
| **Last tested**    | YYYY-MM-DD                       |

### Prerequisites

Before starting, ensure you have:

- [ ] [Required access/permissions]
- [ ] [Required tools installed]
- [ ] [Required credentials/secrets]
- [ ] [Required knowledge/training]

### Who Can Run This

| Role     | Permission Level |
| -------- | ---------------- |
| [Role 1] | Can execute      |
| [Role 2] | Must approve     |

---

## Pre-flight Checklist

Before proceeding, verify:

- [ ] [Critical check 1]
- [ ] [Critical check 2]
- [ ] [Backup completed if needed]
- [ ] [Stakeholders notified if needed]

---

## Procedure

### Step 1: [Step Name]

**What this does**: [Brief explanation]

**Commands**:

```bash
# Description of what this command does
command --with-options
```

**Expected output**:

```
[What you should see when successful]
```

**If this fails**:

1. [First troubleshooting step]
2. [Second troubleshooting step]
3. If still failing, see [Troubleshooting](#troubleshooting) section

---

### Step 2: [Step Name]

**What this does**: [Brief explanation]

**Commands**:

```bash
# Description
command --option value
```

**Expected output**:

```
[Expected successful output]
```

**If this fails**:

- [What to check]
- [How to recover]

---

### Step 3: [Step Name]

**What this does**: [Brief explanation]

**Commands**:

```bash
# Description
final-command --option
```

**Expected output**:

```
[Success message]
```

---

## Verification

After completing the procedure, verify success:

### Automated Checks

```bash
# Health check command
curl -f https://api.example.com/health

# Verification script
npm run verify-deployment
```

### Manual Checks

1. [ ] [First thing to verify]
2. [ ] [Second thing to verify]
3. [ ] [Third thing to verify]

**Expected state**: [Description of successful completion state]

---

## Rollback

If something goes wrong, follow these steps to undo changes.

### When to Rollback

- [Symptom 1 that indicates rollback needed]
- [Symptom 2 that indicates rollback needed]
- [Critical error threshold]

### Immediate Rollback (< 5 minutes)

For quick recovery when issues are detected immediately:

```bash
# Emergency rollback command
rollback-command --immediate
```

### Full Rollback

For complete reversal to previous state:

#### Step 1: Stop Current Process

```bash
# Stop command
```

#### Step 2: Restore Previous State

```bash
# Restore command
```

#### Step 3: Verify Rollback

```bash
# Verification command
```

---

## Troubleshooting

| Symptom                    | Likely Cause | Solution    |
| -------------------------- | ------------ | ----------- |
| [Error message or symptom] | [Root cause] | [Fix steps] |
| [Error message or symptom] | [Root cause] | [Fix steps] |
| [Timeout or hanging]       | [Root cause] | [Fix steps] |
| [Permission denied]        | [Root cause] | [Fix steps] |

### Common Issues

<details>
<summary>Issue: [Common problem description]</summary>

**Symptoms**: [What you see]

**Cause**: [Why it happens]

**Solution**:

```bash
# Fix commands
```

</details>

<details>
<summary>Issue: [Another common problem]</summary>

**Symptoms**: [What you see]

**Cause**: [Why it happens]

**Solution**:

1. [Step 1]
2. [Step 2]

</details>

---

## Emergency Contacts

| Role               | Contact          | When to Escalate      |
| ------------------ | ---------------- | --------------------- |
| [On-call engineer] | [Contact method] | [Escalation criteria] |
| [Team lead]        | [Contact method] | [Escalation criteria] |
| [External vendor]  | [Contact method] | [Escalation criteria] |

---

## Related Documentation

- [Architecture overview](../architecture/OVERVIEW.md)
- [Related runbook](./related-runbook.md)
- [ADR for this process](../decisions/NNNN-decision.md)
- [External documentation](https://example.com/docs)

---

## Changelog

| Date       | Change               | Author |
| ---------- | -------------------- | ------ |
| YYYY-MM-DD | Initial version      | [Name] |
| YYYY-MM-DD | [Change description] | [Name] |

---

## Appendix

### Environment Variables Required

| Variable   | Purpose   | Example         |
| ---------- | --------- | --------------- |
| `VAR_NAME` | [Purpose] | `example-value` |

### Useful Commands Reference

```bash
# Check status
status-command

# View logs
log-command --tail 100

# Debug mode
debug-command --verbose
```

---

_Last updated: YYYY-MM-DD_
_Review frequency: [Monthly/Quarterly/After each use]_
