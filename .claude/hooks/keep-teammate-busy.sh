#!/bin/bash
# =============================================================================
# keep-teammate-busy.sh
# TeammateIdle フック: Teammate がアイドルになる前に未完了タスクの取得を促す
#
# exit code:
#   0 = アイドルを許可（全タスク完了時）
#   2 = フィードバックを送り作業継続を促す
# =============================================================================

# チームのタスクディレクトリを検索
TASKS_DIR="$HOME/.claude/tasks"

if [ ! -d "$TASKS_DIR" ]; then
    exit 0
fi

# 現在アクティブなチームのタスクを確認
pending_count=0
for team_dir in "$TASKS_DIR"/*/; do
    if [ -d "$team_dir" ]; then
        for task_file in "$team_dir"/*.json; do
            if [ -f "$task_file" ]; then
                # pending 状態のタスクを検出
                if grep -q '"status"[[:space:]]*:[[:space:]]*"pending"' "$task_file" 2>/dev/null; then
                    pending_count=$((pending_count + 1))
                fi
            fi
        done
    fi
done

if [ "$pending_count" -gt 0 ]; then
    echo "未完了のタスクが ${pending_count} 件あります。TaskList を確認し、未着手のタスクを claim して作業を継続してください。全タスクが完了するまでアイドルにならないでください。" >&2
    exit 2
fi

exit 0
