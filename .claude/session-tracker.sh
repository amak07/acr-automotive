#!/bin/bash
# Session Time Tracker for ACR Automotive
# Tracks session start/end/pause/continue times for TASKS.md documentation

SESSION_FILE=".claude/session.txt"
PAUSE_FILE=".claude/session-pauses.txt"

# Create .claude directory if it doesn't exist
mkdir -p .claude

case "$1" in
  start)
    if [ -f "$SESSION_FILE" ]; then
      echo ""
      echo "⚠️  Active session already exists!"
      source "$SESSION_FILE"
      echo "   Started: $START_TIME on $START_DATE"
      echo ""
      echo "Options:"
      echo "  1. Continue current session: Do nothing"
      echo "  2. End current session: bash .claude/session-tracker.sh end"
      echo "  3. Force new session: bash .claude/session-tracker.sh end && bash .claude/session-tracker.sh start"
      echo ""
      exit 1
    fi

    START_TIME=$(date "+%I:%M %p")
    START_DATE=$(date "+%B %d, %Y")
    START_EPOCH=$(date +%s)

    echo "START_TIME=$START_TIME" > "$SESSION_FILE"
    echo "START_DATE=$START_DATE" >> "$SESSION_FILE"
    echo "SESSION_START_EPOCH=$START_EPOCH" >> "$SESSION_FILE"
    echo "TOTAL_PAUSE_SECONDS=0" >> "$SESSION_FILE"

    # Clear any old pause records
    rm -f "$PAUSE_FILE"

    echo ""
    echo "✅ Session started at $START_TIME on $START_DATE"
    echo "💡 Say 'session pause' to temporarily stop tracking"
    echo "💡 Say 'session end' when completely done"
    echo ""
    ;;

  pause)
    if [ ! -f "$SESSION_FILE" ]; then
      echo "⚠️  No active session found. Run 'bash .claude/session-tracker.sh start' first."
      exit 1
    fi

    source "$SESSION_FILE"

    # Check if already paused
    if [ -n "$PAUSE_START_EPOCH" ]; then
      echo ""
      echo "⚠️  Session already paused!"
      PAUSE_START_TIME=$(date -d "@$PAUSE_START_EPOCH" "+%I:%M %p" 2>/dev/null || date -r "$PAUSE_START_EPOCH" "+%I:%M %p")
      echo "   Paused since: $PAUSE_START_TIME"
      echo "💡 Say 'session continue' to resume"
      echo ""
      exit 1
    fi

    PAUSE_START_EPOCH=$(date +%s)
    PAUSE_START_TIME=$(date "+%I:%M %p")

    # Add pause start to session file
    echo "PAUSE_START_EPOCH=$PAUSE_START_EPOCH" >> "$SESSION_FILE"

    # Record pause event
    echo "PAUSE|$PAUSE_START_EPOCH|$PAUSE_START_TIME" >> "$PAUSE_FILE"

    echo ""
    echo "⏸️  Session paused at $PAUSE_START_TIME"
    echo "💡 Say 'session continue' to resume tracking"
    echo ""
    ;;

  continue|resume)
    if [ ! -f "$SESSION_FILE" ]; then
      echo "⚠️  No active session found. Run 'bash .claude/session-tracker.sh start' first."
      exit 1
    fi

    source "$SESSION_FILE"

    # Check if session is actually paused
    if [ -z "$PAUSE_START_EPOCH" ]; then
      echo ""
      echo "⚠️  Session is not paused!"
      echo "💡 Session is currently active and tracking"
      echo ""
      exit 1
    fi

    CONTINUE_EPOCH=$(date +%s)
    CONTINUE_TIME=$(date "+%I:%M %p")

    # Calculate pause duration
    PAUSE_DURATION=$((CONTINUE_EPOCH - PAUSE_START_EPOCH))
    PAUSE_MINUTES=$((PAUSE_DURATION / 60))

    # Add to total pause time
    NEW_TOTAL_PAUSE=$((TOTAL_PAUSE_SECONDS + PAUSE_DURATION))

    # Record continue event
    echo "CONTINUE|$CONTINUE_EPOCH|$CONTINUE_TIME|$PAUSE_DURATION" >> "$PAUSE_FILE"

    # Update session file (remove pause state, update total)
    grep -v "^PAUSE_START_EPOCH=" "$SESSION_FILE" > "${SESSION_FILE}.tmp"
    grep -v "^TOTAL_PAUSE_SECONDS=" "${SESSION_FILE}.tmp" > "$SESSION_FILE"
    rm "${SESSION_FILE}.tmp"
    echo "TOTAL_PAUSE_SECONDS=$NEW_TOTAL_PAUSE" >> "$SESSION_FILE"

    echo ""
    echo "▶️  Session resumed at $CONTINUE_TIME"
    echo "⏸️  Pause duration: ${PAUSE_MINUTES}m"
    echo "💡 Say 'session pause' to pause again or 'session end' when done"
    echo ""
    ;;

  end)
    if [ ! -f "$SESSION_FILE" ]; then
      echo "⚠️  No active session found. Run 'bash .claude/session-tracker.sh start' first."
      exit 1
    fi

    source "$SESSION_FILE"

    # If session is paused, auto-resume it for final calculation
    if [ -n "$PAUSE_START_EPOCH" ]; then
      CONTINUE_EPOCH=$(date +%s)
      PAUSE_DURATION=$((CONTINUE_EPOCH - PAUSE_START_EPOCH))
      TOTAL_PAUSE_SECONDS=$((TOTAL_PAUSE_SECONDS + PAUSE_DURATION))
      echo ""
      echo "ℹ️  Session was paused - automatically resuming for final calculation"
    fi

    END_TIME=$(date "+%I:%M %p")
    END_DATE=$(date "+%B %d, %Y")
    END_EPOCH=$(date +%s)

    # Calculate total elapsed time
    TOTAL_ELAPSED=$((END_EPOCH - SESSION_START_EPOCH))

    # Calculate actual work time (elapsed - pauses)
    WORK_SECONDS=$((TOTAL_ELAPSED - TOTAL_PAUSE_SECONDS))
    WORK_HOURS=$((WORK_SECONDS / 3600))
    WORK_MINUTES=$(((WORK_SECONDS % 3600) / 60))

    # Calculate pause time for display
    PAUSE_HOURS=$((TOTAL_PAUSE_SECONDS / 3600))
    PAUSE_MINUTES=$(((TOTAL_PAUSE_SECONDS % 3600) / 60))

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 SESSION SUMMARY"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📅 Date: $START_DATE"
    echo "⏱️  Time: $START_TIME - $END_TIME"
    echo "⏳ Total Duration: ${WORK_HOURS}h ${WORK_MINUTES}m (work time)"

    if [ $TOTAL_PAUSE_SECONDS -gt 0 ]; then
      echo "⏸️  Pause Time: ${PAUSE_HOURS}h ${PAUSE_MINUTES}m"

      # Show pause details if file exists
      if [ -f "$PAUSE_FILE" ]; then
        echo ""
        echo "📋 Pause History:"
        PAUSE_NUM=1
        while IFS='|' read -r action epoch time duration; do
          if [ "$action" = "PAUSE" ]; then
            echo "   Pause $PAUSE_NUM: $time"
          elif [ "$action" = "CONTINUE" ]; then
            PAUSE_MIN=$((duration / 60))
            echo "   Resume $PAUSE_NUM: $time (paused for ${PAUSE_MIN}m)"
            PAUSE_NUM=$((PAUSE_NUM + 1))
          fi
        done < "$PAUSE_FILE"
      fi
    fi

    echo ""

    # Git stats
    LINES_CHANGED=$(git diff --numstat 2>/dev/null | awk '{sum += $1 + $2} END {print sum+0}')
    FILES_CHANGED=$(git diff --name-only 2>/dev/null | wc -l)
    COMMITS=$(git log --since="$SESSION_START_EPOCH" --oneline 2>/dev/null | wc -l)

    echo "📊 Git Stats:"
    echo "   Lines Changed: $LINES_CHANGED"
    echo "   Files Modified: $FILES_CHANGED"
    echo "   Commits Made: $COMMITS"
    echo ""

    # Generate TASKS.md entry
    echo "📝 Copy this to docs/TASKS.md:"
    echo ""
    echo "| [SESSION_NUMBER] | $START_DATE | $START_TIME | $END_TIME | ${WORK_HOURS}h ${WORK_MINUTES}m | [Work description here] |"
    echo ""

    # Clean up
    rm -f "$SESSION_FILE"
    rm -f "$PAUSE_FILE"
    ;;

  status)
    if [ -f "$SESSION_FILE" ]; then
      source "$SESSION_FILE"
      CURRENT_EPOCH=$(date +%s)

      # Check if currently paused
      if [ -n "$PAUSE_START_EPOCH" ]; then
        PAUSE_DURATION=$((CURRENT_EPOCH - PAUSE_START_EPOCH))
        PAUSE_MINUTES=$((PAUSE_DURATION / 60))

        echo ""
        echo "⏸️  SESSION PAUSED"
        echo "   Started: $START_TIME ($START_DATE)"
        PAUSE_TIME=$(date -d "@$PAUSE_START_EPOCH" "+%I:%M %p" 2>/dev/null || date -r "$PAUSE_START_EPOCH" "+%I:%M %p")
        echo "   Paused: $PAUSE_TIME"
        echo "   Pause Duration: ${PAUSE_MINUTES}m"
        echo ""
        echo "💡 Say 'session continue' to resume"
        echo ""
      else
        # Calculate active time
        TOTAL_ELAPSED=$((CURRENT_EPOCH - SESSION_START_EPOCH))
        WORK_SECONDS=$((TOTAL_ELAPSED - TOTAL_PAUSE_SECONDS))
        WORK_HOURS=$((WORK_SECONDS / 3600))
        WORK_MINUTES=$(((WORK_SECONDS % 3600) / 60))

        echo ""
        echo "⏱️  ACTIVE SESSION"
        echo "   Started: $START_TIME ($START_DATE)"
        echo "   Work Time: ${WORK_HOURS}h ${WORK_MINUTES}m"

        if [ $TOTAL_PAUSE_SECONDS -gt 0 ]; then
          PAUSE_HOURS=$((TOTAL_PAUSE_SECONDS / 3600))
          PAUSE_MINUTES=$(((TOTAL_PAUSE_SECONDS % 3600) / 60))
          echo "   Total Pauses: ${PAUSE_HOURS}h ${PAUSE_MINUTES}m"
        fi

        echo ""
        echo "💡 Say 'session pause' to pause or 'session end' to finish"
        echo ""
      fi
    else
      echo ""
      echo "ℹ️  No active session"
      echo "💡 Say 'session start' to begin tracking"
      echo ""
    fi
    ;;

  *)
    echo ""
    echo "Usage: bash .claude/session-tracker.sh {start|pause|continue|end|status}"
    echo ""
    echo "Commands:"
    echo "  start    - Begin tracking a new session"
    echo "  pause    - Temporarily pause tracking (e.g., lunch break)"
    echo "  continue - Resume tracking after a pause"
    echo "  end      - End session and generate TASKS.md entry"
    echo "  status   - Check current session status"
    echo ""
    echo "Integration with Claude Code:"
    echo "  Say 'session start' in chat   → Auto-runs this script"
    echo "  Say 'session pause' in chat   → Auto-runs pause"
    echo "  Say 'session continue' in chat → Auto-runs continue"
    echo "  Say 'session end' in chat     → Auto-detects and uses data"
    echo ""
    exit 1
    ;;
esac
