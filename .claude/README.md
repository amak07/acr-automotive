# Claude Code Hooks Configuration

> **Purpose**: Automated documentation reminders and file protection for ACR Automotive

## Overview

This project uses Claude Code hooks to automate documentation workflows and protect critical infrastructure files. Hooks run automatically during the Claude Code agent loop.

## Active Hooks

### 1. SessionStart - Project Context Loader

**Triggers**: Every time you start or resume a Claude Code session
**Purpose**: Loads project context and reminds Claude to check TASKS.md

**What you'll see**:

```
📚 ACR Automotive - Session Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 FIRST: Read docs/TASKS.md for current phase context
...
```

**Effect**: Claude automatically knows to check TASKS.md first without you asking.

---

### 2. UserPromptSubmit - Smart Session Management (ENHANCED!)

**Triggers**: When you send messages with session keywords

**Session Control Commands**:

- **"session start"** → Automatically runs session tracker
- **"session pause"** → Pauses time tracking (lunch, meetings, breaks)
- **"session continue"** or **"session resume"** → Resumes tracking after pause
- **"session end"** → Ends session with full stats and TASKS.md update

**Also triggers on**: "session complete", "update tasks", "done for today", "wrap up", "finishing up"

**What you'll see** (when you say "session end"):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 SESSION END DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Session Info:
   Date: October 25, 2025
   End Time: 02:45 PM
   Branch: dev

📊 Session Stats:
   Lines Changed: 847
   Files Modified: 12
   Commits Today: 3

📝 ACTION REQUIRED:
   Please update docs/TASKS.md with:
   1. Session number and date
   2. Start time (ask user) and end time (02:45 PM)
   3. Duration (calculate from user's start time)
   4. Work completed summary

💡 Also consider:
   • Document new features in docs/features/
   • Update architecture docs if patterns changed
   • Commit any uncommitted work
```

**Effect**:

- Automatic time tracking with system time
- Git statistics (lines changed, files modified, commits)
- Comprehensive reminder to update TASKS.md
- Claude will proactively ask for your start time and calculate duration

---

### 3. Stop - Large Feature Detection

**Triggers**: After Claude finishes responding (every response)
**Threshold**: Only alerts if git diff shows >500 lines changed

**What you'll see** (if threshold exceeded):

```
⚠️  LARGE FEATURE DETECTED: 847 lines changed

📝 Consider documenting this work:
   • Update docs/TASKS.md session log
   • Create feature doc in docs/features/{category}/
   • Update architecture docs if needed
```

**Effect**: Automatic detection of major features that need documentation.

---

### 4. PostToolUse (Bash) - Git Commit Reminder

**Triggers**: After Claude runs a git commit command
**Purpose**: Reminds you to update session logs after commits

**What you'll see**:

```
✅ Commit created
💡 Tip: Remember to update docs/TASKS.md session summary
```

**Effect**: Perfect timing to update TASKS.md right after code is committed.

---

### 5. PostToolUse (Write|Edit) - Feature Docs Tracking

**Triggers**: After Claude creates/updates files in `docs/features/`
**Purpose**: Ensures docs/README.md index stays synchronized

**What you'll see**:

```
📚 Feature docs updated: docs/features/search/PUBLIC_SEARCH.md
💡 Remember to update docs/README.md index if this is a new feature
```

**Effect**: Maintains cross-references between documentation files.

---

### 6. PreToolUse - File Protection (SECURITY)

**Triggers**: BEFORE Claude writes/edits any file
**Purpose**: Protects critical infrastructure and secrets

#### Protection Levels

**DENY (Blocked automatically)**:

- `.env`, `.env.local`, `.env.production`, `.env.development`
- `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`

**ASK (Requires your permission)**:

- `src/lib/supabase/schema.sql`
- `supabase/migrations/*.sql`
- `scripts/migrations/*.sql`
- `.env.example`
- `vercel.json`
- `next.config.js`, `next.config.mjs`, `next.config.ts`

**What happens when blocked**:

```
🚫 BLOCKED: Cannot modify protected file: .env
   Reason: Secrets and lock files should not be edited by AI
```

**What happens when permission required**:

```
⚠️  PERMISSION REQUIRED: Infrastructure file modification
   File: src/lib/supabase/schema.sql
   This file affects database schema or deployment config

[VSCode will prompt you: Allow / Deny / Always Allow / Always Deny]
```

---

## Session Time Tracking (Optional Enhancement)

### Manual Session Tracker

For even more precise time tracking, use the session tracker script:

**Start a session**:

```bash
bash .claude/session-tracker.sh start
```

Output:

```
✅ Session started at 02:15 PM on October 25, 2025
💡 Say 'session end' when done to get automatic time tracking
```

**Check session status**:

```bash
bash .claude/session-tracker.sh status
```

Output:

```
⏱️  Active session since 02:15 PM (October 25, 2025)
⏳ Elapsed: 2h 30m
```

**End session**:

```bash
bash .claude/session-tracker.sh end
```

Output:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SESSION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Date: October 25, 2025
⏱️  Time: 02:15 PM - 04:45 PM
⏳ Duration: 2h 30m

📊 Git Stats:
   Lines Changed: 847
   Files Modified: 12
   Commits Made: 3

📝 Copy this to docs/TASKS.md:

| 17 | October 25, 2025 | 02:15 PM | 04:45 PM | 2h 30m | [Work description here] |
```

**Benefits**:

- Automatic duration calculation (no mental math!)
- Pre-formatted TASKS.md table row (copy-paste ready)
- Git statistics included
- Tracks session from start to end

**Integration with Hooks** (Automatic!):

- Run `bash .claude/session-tracker.sh start` when you begin work (optional but recommended)
- Say "session end" to Claude when done
- **Hook automatically detects** if you used the session tracker:
  - ✅ **Tracker used**: Shows auto-calculated duration, no need to ask user
  - ⚠️ **Tracker NOT used**: Claude asks for start time manually
- Either way, you get a TASKS.md session summary!

---

## Testing Your Hooks

### Test SessionStart

Restart Claude Code session and you should see the welcome banner.

### Test UserPromptSubmit

Type: "I'm done for today, session end"
You should see: `[🤖 DOCUMENTATION REMINDER]` in the response.

### Test Stop Hook

Make a large change (>500 lines) and wait for Claude to finish responding.
You should see the large feature detection warning.

### Test File Protection

Ask Claude to edit `.env` - it should be blocked.
Ask Claude to edit `schema.sql` - you should be prompted for permission.

---

## Debugging Hooks

### View Hook Output

Run Claude Code with debug flag:

```bash
claude --debug
```

This shows:

- Which hooks matched
- Commands executed
- Exit codes and output
- Execution timing

### View Transcript Mode

Press **Ctrl-R** during a Claude Code session to see hook output in the transcript.

---

## Customizing Hooks

### Adjust Large Change Threshold

In `settings.json`, find the Stop hook and change:

```bash
if [ "$LINES_CHANGED" -gt 500 ]
# Change 500 to your preferred threshold (e.g., 300, 1000)
```

### Add More Protected Files

In the PreToolUse hook, add patterns to:

```bash
PROTECTED_CRITICAL="(schema\.sql|your-file\.txt)"
```

### Add More Completion Keywords

In UserPromptSubmit hook, add to the regex:

```bash
"(session end|session complete|your-keyword)"
```

---

## Prerequisites

### jq (JSON Parser)

This hook configuration requires `jq` for robust JSON parsing.

**Installation** (already done for this project):

```bash
mkdir -p ~/bin
curl -L https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-win64.exe -o ~/bin/jq.exe
chmod +x ~/bin/jq.exe
```

**Verify installation**:

```bash
~/bin/jq.exe --version
# Should output: jq-1.7.1
```

**Note**: The hooks reference `~/bin/jq.exe` which resolves to `C:/Users/abelm/bin/jq.exe` in your Git Bash environment.

## Troubleshooting

### Hooks Not Running

**Check bash availability**:

```bash
bash --version
```

If not found, install Git for Windows (includes Git Bash).

### JSON Parsing Errors

**If you see "jq not found" errors**:

1. Verify jq is installed: `~/bin/jq.exe --version`
2. If missing, reinstall using the commands in Prerequisites section above
3. Restart your Claude Code session

### Hooks Too Noisy

Adjust thresholds or disable specific hooks by removing them from `settings.json`.

### Hooks Too Quiet

Change output from `stdout` to `stderr` by adding `>&2` to echo commands.

---

## File Structure

```
.claude/
├── settings.json          # Hook configuration (this is the active file)
├── settings.local.json    # Optional: Local overrides (not tracked in git)
└── README.md             # This documentation
```

**Note**: `.claude/` is in `.gitignore` so your hooks won't be shared with the team. If you want to share hooks, create `.claude/settings.json` in version control.

---

## Security Considerations

⚠️ **IMPORTANT**: Hooks execute shell commands automatically with your credentials.

**Best Practices**:

1. Review all hook commands before enabling
2. Never run hooks from untrusted sources
3. Always quote variables: `"$VAR"` not `$VAR`
4. Protect sensitive files (done via PreToolUse hook)
5. Use absolute paths when possible

---

## Related Documentation

- [Claude Code Hooks Guide](https://docs.claude.com/en/docs/claude-code/hooks-guide)
- [Project Documentation Standards](../docs/README.md)
- [TASKS.md Session Tracking](../docs/TASKS.md)

---

**Last Updated**: 2025-10-25
**Hook Version**: 1.0 (Smart Reminders)
