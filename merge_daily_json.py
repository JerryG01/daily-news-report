import json
import os
from datetime import datetime

# 支持命令行日期参数
import sys
today = sys.argv[1] if len(sys.argv) > 1 else datetime.now().strftime("%Y-%m-%d")
workdir = os.path.dirname(os.path.abspath(__file__))  # projects/daily-news-report/
data_dir = os.path.join(workdir, "data")
report_dir = os.path.join(workdir, "report")

final_data = {
    "status": {"run_status": "pending", "header_template": "数据收集中..."},
    "events": [],
    "fun_fact": None,
    "selected_articles": []
}

# 1. 读取 events（news_reporter 直接输出 YYYY-MM-DD.json）
events_file = os.path.join(data_dir, f"{today}.json")
if os.path.exists(events_file):
    with open(events_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    final_data["status"] = data.get("status", final_data["status"])
    final_data["events"] = data.get("events", [])
    print(f"✅ 已加载 events：{len(final_data['events'])} 条")
else:
    print(f"⚠️ 警告：今日简报数据尚未生成 {events_file}")

# 2. 解析 Fun Fact（coach 的 .txt）
fun_fact_txt = os.path.join(data_dir, f"lunch_fact_{today.replace('-','')}.txt")
if os.path.exists(fun_fact_txt):
    with open(fun_fact_txt, "r", encoding="utf-8") as f:
        content = f.read().strip()
    # 尝试解析：第一行为标题，其余为内容
    lines = content.split('\n')
    if len(lines) >= 1:
        final_data["fun_fact"] = {
            "title": lines[0].strip(),
            "content": '\n'.join(lines[1:]).strip() if len(lines) > 1 else lines[0].strip(),
            "date": today,
            "generated_at": datetime.now().isoformat()
        }
    print(f"✅ 已加载 Fun Fact：{final_data['fun_fact']['title']}")
else:
    print(f"⚠️ 警告：今日 Fun Fact 尚未生成")

# 3. selected_articles 暂用空数组
final_data["selected_articles"] = []

# 4. 输出到 report/
os.makedirs(report_dir, exist_ok=True)
output_file = os.path.join(report_dir, f"{today}.json")
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(final_data, f, ensure_ascii=False, indent=2)
print(f"✅ 总编装配完成：{output_file}")
