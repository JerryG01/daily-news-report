#!/bin/bash
# Sync 简报到 GitHub / Cloudflare Pages
# 由 OpenClaw cron 调用（每天 09:05 / 12:35 / 18:00）
# 命名规范：
#   daily_brief_YYYYMMDD_morning.html
#   daily_brief_YYYYMMDD_afternoon.html
#   fun_fact_YYYYMMDD.html
#
# QA 最小替代校验：
#   bash sync/qa_check.sh [YYYYMMDD]
# 说明：12:30 Coach heartbeat 目前可能出现“产物已生成但 cron 记 error”的误报。
# 本轮仅修正 QA 判读逻辑，不宣称已彻底修复；必须在下一个 12:30 场次实跑复核。

set -euo pipefail

REPORTS_DIR="$HOME/.openclaw/workspace-news_reporter/reports"
SYNC_DIR="$HOME/.openclaw/workspace-news_reporter/sync"
COACH_REPORTS_DIR="$HOME/.openclaw/workspace-coach/reports"
TODAY=$(date +%Y%m%d)
SYNC_REPORTS_DIR="$SYNC_DIR/reports"

# 发布说明：当前主发布面为 Cloudflare Pages（GitHub 仓库 push 后自动触发）
# GitHub 仍作为源仓库与 Pages 构建源，不再在脚本中内嵌 PAT。

cd "$SYNC_DIR"
mkdir -p "$SYNC_REPORTS_DIR"

copy_if_exists() {
  local src="$1"
  local dst="$2"
  if [ -f "$src" ]; then
    cp "$src" "$dst"
    echo "[sync] copied: $(basename "$src") → $(basename "$dst")"
    return 0
  fi
  echo "[sync] missing: $src"
  return 1
}

html_escape() {
  python3 - <<'PY' "$1"
import html, sys
print(html.escape(sys.argv[1]))
PY
}

render_fun_fact_html() {
  local src_txt="$1"
  local dst_html="$2"

  python3 - <<'PY' "$src_txt" "$dst_html"
from pathlib import Path
from html import escape
import re
import sys

src = Path(sys.argv[1])
dst = Path(sys.argv[2])
text = src.read_text(encoding='utf-8').replace('\r\n', '\n').strip()
lines = [line.strip() for line in text.split('\n')]
non_empty = [line for line in lines if line]

source_label = ''
source_url = ''
generated_at = ''
body_lines = []

for line in non_empty:
    if line.startswith('来源：'):
        payload = line.split('：', 1)[1].strip()
        if re.match(r'https?://', payload):
            source_url = payload
        else:
            source_label = payload
    elif line.startswith('Source:') and not source_url:
        payload = line.split(':', 1)[1].strip()
        if re.match(r'https?://', payload):
            source_url = payload
        else:
            source_label = payload
    elif line.startswith('生成时间：'):
        generated_at = line.split('：', 1)[1].strip()
    elif line.startswith('Generated at:') and not generated_at:
        generated_at = line.split(':', 1)[1].strip()
    else:
        body_lines.append(line)

if not generated_at:
    generated_at = src.stat().st_mtime_ns

paragraphs = []
buffer = []
for line in body_lines:
    if not line:
        if buffer:
            paragraphs.append(' '.join(buffer).strip())
            buffer = []
    else:
        buffer.append(line)
if buffer:
    paragraphs.append(' '.join(buffer).strip())

rendered = []
for idx, para in enumerate(paragraphs):
    safe = escape(para)
    if idx == 0:
        rendered.append(f"<p class='funfact-kicker'>{safe}</p>")
    elif para.startswith('【') and para.endswith('】'):
        rendered.append(f"<h3 class='funfact-headline'>{safe}</h3>")
    else:
        rendered.append(f"<p class='funfact-paragraph'>{safe}</p>")

if source_url:
    source_html = f"<a href='{escape(source_url, quote=True)}' target='_blank' rel='noopener noreferrer'>{escape(source_label or source_url)}</a>"
else:
    source_html = escape(source_label or '未提供')

html_doc = f"""<article class='funfact-article'>
  <header class='funfact-header'>
    <div class='funfact-eyebrow'>🧠 Bubble Breaker Fun Fact</div>
    <div class='funfact-meta'>
      <div><span class='funfact-meta-label'>source</span><span class='funfact-meta-value'>{source_html}</span></div>
      <div><span class='funfact-meta-label'>generated_at</span><span class='funfact-meta-value'>{escape(str(generated_at))}</span></div>
    </div>
  </header>
  <section class='funfact-content'>
    {''.join(rendered)}
  </section>
</article>
"""

dst.write_text(html_doc, encoding='utf-8')
PY
}

# ── 1. 日度简报 ─────────────────────────────────────────
MORNING_SRC="$REPORTS_DIR/daily_brief_${TODAY}_morning.html"
AFTERNOON_SRC="$REPORTS_DIR/daily_brief_${TODAY}_afternoon.html"

copy_if_exists "$MORNING_SRC" "$SYNC_REPORTS_DIR/daily_brief_${TODAY}_morning.html" || true
copy_if_exists "$AFTERNOON_SRC" "$SYNC_REPORTS_DIR/daily_brief_${TODAY}_afternoon.html" || true

# ── 2. Fun Fact ──────────────────────────────────────────
FUN_FACT_SRC="$COACH_REPORTS_DIR/lunch_fact_${TODAY}.txt"
if [ -f "$FUN_FACT_SRC" ]; then
  render_fun_fact_html "$FUN_FACT_SRC" "$SYNC_REPORTS_DIR/fun_fact_${TODAY}.html"
  echo "[sync] rendered: fun_fact_${TODAY}.html"
else
  echo "[sync] missing: $FUN_FACT_SRC"
fi

# ── 3. Articles Summary（精确日期优先，禁止跨日模糊匹配） ──────────────────────────────────
ARTICLES_STD_SRC="$HOME/.openclaw/workspace-news_reporter/articles_summary_${TODAY}.md"
ARTICLES_LEGACY_SRC=$(find "$HOME/.openclaw/workspace-news_reporter" -maxdepth 1 -type f \( -name "articles_summary_$(date +%-m)_$(date +%-d).md" -o -name "articles_summary_$(date +%m)_$(date +%d).md" \) | sort | tail -n 1)

if [ -f "$ARTICLES_STD_SRC" ]; then
  cp "$ARTICLES_STD_SRC" "$SYNC_REPORTS_DIR/$(basename "$ARTICLES_STD_SRC")"
  echo "[sync] copied exact-date articles summary: $(basename "$ARTICLES_STD_SRC")"
elif [ -n "${ARTICLES_LEGACY_SRC:-}" ] && [ -f "$ARTICLES_LEGACY_SRC" ]; then
  cp "$ARTICLES_LEGACY_SRC" "$SYNC_REPORTS_DIR/$(basename "$ARTICLES_LEGACY_SRC")"
  echo "[sync] copied same-day legacy articles summary: $(basename "$ARTICLES_LEGACY_SRC")"
else
  echo "[sync] no same-day articles summary found for ${TODAY}"
fi

# ── 4. index.json（扫描 reports/ 下所有文件生成清单）───────
python3 - <<'PY' "$SYNC_REPORTS_DIR" > "$SYNC_REPORTS_DIR/index.json"
from pathlib import Path
from datetime import datetime, timezone
import json
import re
import sys

reports_dir = Path(sys.argv[1])
items = {"reports": [], "fun_facts": [], "articles": []}

for path in sorted(reports_dir.glob('daily_brief_20*_*.html'), key=lambda p: p.name, reverse=True):
    m = re.match(r'daily_brief_(\d{8})_(morning|afternoon)\.html$', path.name)
    if not m:
        continue
    date_str, type_str = m.groups()
    items['reports'].append({"date": date_str, "type": type_str, "file": path.name})

for path in sorted(reports_dir.glob('fun_fact_20*.html'), key=lambda p: p.name, reverse=True):
    m = re.match(r'fun_fact_(\d{8})\.html$', path.name)
    if not m:
        continue
    items['fun_facts'].append({"date": m.group(1), "type": "fun_fact", "file": path.name})

for path in sorted(reports_dir.glob('articles_summary*.md'), key=lambda p: p.name, reverse=True):
    date_str = ''
    m = re.search(r'(20\d{6})', path.name)
    if m:
        date_str = m.group(1)
    else:
        legacy = re.search(r'_(\d{1,2})_(\d{1,2})\.md$', path.name)
        if legacy:
            month, day = legacy.groups()
            date_str = f"2026{int(month):02d}{int(day):02d}"
    items['articles'].append({"date": date_str, "type": "articles", "file": path.name})

items['generated'] = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
print(json.dumps(items, ensure_ascii=False, indent=2))
PY

echo "[sync] index.json generated"

# ── 4.1 发布前自检 ──────────────────────────────────────
bash "$SYNC_DIR/qa_check.sh" "$TODAY"

# ── 5. Git 推送 ─────────────────────────────────────────
cd "$SYNC_DIR"
git add reports index.html sync.sh qa_check.sh DEPLOYMENT.md

git diff --cached --quiet && {
  echo "[sync] no changes to commit"
  exit 0
}

git commit -m "Sync: $(date +%Y-%m-%d\ %H:%M)"

git push origin main

echo "[sync] Done: $(date)"