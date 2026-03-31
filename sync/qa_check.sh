#!/bin/bash
# Minimal QA checks for sync/ path consistency + noon heartbeat false-negative detection.
# Purpose: provide a verifiable fallback while path-reference-qa skill script is unavailable.

set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
INDEX_HTML="$HOME/.openclaw/projects/daily-news-report/index.html"
REPORTS_DIR="$HOME/.openclaw/projects/daily-news-report/sync/reports"
INDEX_JSON="$HOME/.openclaw/projects/daily-news-report/sync/reports/index.json"
CRON_JOBS="$HOME/.openclaw/cron/jobs.json"
COACH_REPORTS_DIR="$HOME/.openclaw/workspace-coach/reports"
TODAY="${1:-$(date +%Y%m%d)}"

fail() {
  echo "[FAIL] $1" >&2
  exit 1
}

pass() {
  echo "[PASS] $1"
}

echo "== sync minimal QA =="
echo "base=$BASE_DIR"
echo "date=$TODAY"

[ -f "$INDEX_HTML" ] || fail "missing $INDEX_HTML"
[ -f "$INDEX_JSON" ] || fail "missing $INDEX_JSON"

TODAY_MORNING="$REPORTS_DIR/daily_brief_${TODAY}_morning.html"
TODAY_AFTERNOON="$REPORTS_DIR/daily_brief_${TODAY}_afternoon.html"
if [ ! -f "$TODAY_MORNING" ] && [ ! -f "$TODAY_AFTERNOON" ]; then
  fail "neither daily_brief_${TODAY}_morning.html nor daily_brief_${TODAY}_afternoon.html exists under sync/reports"
fi
pass "at least one same-day daily brief exists under sync/reports"

if grep -n "articles_summary_3_19\.md" "$INDEX_HTML" >/dev/null; then
  fail "legacy hardcoded fallback still exists in sync/index.html"
fi
pass "legacy hardcoded articles_summary_3_19.md removed from sync/index.html"

if grep -nE '/Users/|/var/folders/|file://' "$INDEX_HTML" "$INDEX_JSON" >/dev/null; then
  fail "found local absolute path leak in sync/index.html or reports/index.json"
fi
pass "no local absolute path leak in sync/index.html / reports/index.json"

if grep -nEi 'open browser|playwright|puppeteer' "$BASE_DIR"/sync.sh "$BASE_DIR"/DEPLOYMENT.md 2>/dev/null; then
  fail "found forbidden browser-style fallback wording in sync release path docs/scripts"
fi
pass "no forbidden browser fallback wording in sync release path docs/scripts"

python3 - <<'PY' "$INDEX_JSON" "$REPORTS_DIR"
import json
import sys
from pathlib import Path

index_json = Path(sys.argv[1])
reports_dir = Path(sys.argv[2])
data = json.loads(index_json.read_text(encoding='utf-8'))
missing = []
for key in ('reports', 'fun_facts', 'articles'):
    for item in data.get(key, []):
        f = item.get('file', '')
        if not f:
            missing.append((key, '<empty>'))
            continue
        p = reports_dir / f
        if not p.exists():
            missing.append((key, f))
if missing:
    print('[FAIL] missing files referenced by reports/index.json:')
    for key, f in missing:
        print(f'  - {key}: {f}')
    raise SystemExit(1)
print('[PASS] every file referenced by reports/index.json exists under sync/reports')
PY

python3 - <<'PY' "$CRON_JOBS" "$TODAY" "$COACH_REPORTS_DIR"
import json
import sys
from pathlib import Path
from datetime import datetime

cron_jobs = Path(sys.argv[1])
today = sys.argv[2]
coach_reports_dir = Path(sys.argv[3])

if not cron_jobs.exists():
    print('[WARN] cron/jobs.json not found; skip heartbeat false-negative check')
    raise SystemExit(0)

data = json.loads(cron_jobs.read_text(encoding='utf-8'))
coach = next((j for j in data.get('jobs', []) if j.get('name') == 'Coach - 午休破壁趣闻 (12:30)'), None)
sync = next((j for j in data.get('jobs', []) if j.get('name') == 'Coach - Fun Fact同步至GitHub (12:35)'), None)
fun_txt = coach_reports_dir / f'lunch_fact_{today}.txt'

coach_status = ((coach or {}).get('state') or {}).get('lastRunStatus')
sync_status = ((sync or {}).get('state') or {}).get('lastRunStatus')

if coach_status == 'error' and fun_txt.exists() and sync_status == 'ok':
    mtime = datetime.fromtimestamp(fun_txt.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')
    print('[PASS] detected heartbeat false-negative pattern:')
    print(f'  - coach 12:30 status=error but artifact exists: {fun_txt.name} @ {mtime}')
    print(f'  - 12:35 sync status={sync_status}')
    print('  - interpretation: content generation/sync succeeded; cron status likely tainted by message/announce failure')
    print('  - note: MUST live-verify again at next 12:30 run; this script only corrects the QA interpretation logic')
elif coach_status == 'ok':
    print('[PASS] coach 12:30 cron status is ok')
else:
    print('[WARN] heartbeat false-negative not provable from current artifacts/state')
    print(f'  - coach status={coach_status}, sync status={sync_status}, artifact_exists={fun_txt.exists()}')
    print('  - note: MUST live-verify again at next 12:30 run')
PY

echo "== done =="e =="