#!/bin/bash
# Sync简报到 GitHub 的脚本
# 由 OpenClaw cron 调用
# 路径：~/.openclaw/workspace-news_reporter/sync/sync.sh

set -e

REPORTS_DIR="$HOME/.openclaw/workspace-news_reporter/reports"
SYNC_DIR="$HOME/.openclaw/workspace-news_reporter/sync"
GIT_REMOTE="https://JerryG01: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@github.com/JerryG01/daily-news-report.git"

cd "$SYNC_DIR"

# 获取最新简报文件
LATEST_BRIEF=$(ls -t "$REPORTS_DIR"/daily_brief_20*.html 2>/dev/null | head -1 || true)
LATEST_FULL=$(ls -t "$REPORTS_DIR"/daily_brief.html 2>/dev/null | head -1 || true)

if [ -z "$LATEST_BRIEF" ] && [ -z "$LATEST_FULL" ]; then
    echo "No brief files found, skipping sync"
    exit 0
fi

# 复制简报到 sync 目录
cp "$LATEST_BRIEF" "$SYNC_DIR/reports/daily_brief_pre_latest.html" 2>/dev/null || true
cp "$LATEST_FULL" "$SYNC_DIR/reports/daily_brief.html" 2>/dev/null || true

# 生成 index.json 清单
cat > "$SYNC_DIR/reports/index.json" << EOF
{
  "lastUpdated": "$(date -u +%Y-%m-%dT%H:%M:%S+08:00)",
  "reports": [
    {
      "date": "$(date +%Y-%m-%d)",
      "type": "pre",
      "filename": "daily_brief_pre_latest.html"
    }
  ],
  "latestFull": "daily_brief.html"
}
EOF

# Git add + commit + push
git add .
git commit -m "Sync: $(date +%Y-%m-%d\ %H:%M)" || true
git push "$GIT_REMOTE" main --force

echo "Sync complete: $(date)"