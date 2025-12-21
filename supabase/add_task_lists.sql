-- タスクリストテーブルの作成
-- ユーザーがタスクをグループ化するためのリスト

CREATE TABLE IF NOT EXISTS task_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6B7280',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLSポリシー
ALTER TABLE task_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lists"
    ON task_lists FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lists"
    ON task_lists FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists"
    ON task_lists FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists"
    ON task_lists FOR DELETE
    USING (auth.uid() = user_id);

-- tasksテーブルにlist_idカラムを追加
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS list_id UUID REFERENCES task_lists(id) ON DELETE SET NULL;

-- scheduled_tasksテーブルにlist_idカラムを追加
ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS list_id UUID REFERENCES task_lists(id) ON DELETE SET NULL;

-- インデックス追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_task_lists_user_id ON task_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_list_id ON scheduled_tasks(list_id);
