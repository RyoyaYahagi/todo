import React, { useState } from 'react';
import type { Priority, TaskScheduleType, RecurrenceType, RecurrenceRule } from '../types';
import { format } from 'date-fns';

interface TaskFormProps {
    onAdd: (
        title: string,
        scheduleType: TaskScheduleType,
        options?: {
            priority?: Priority;
            manualScheduledTime?: number;
            recurrence?: RecurrenceRule;
        }
    ) => void;
    maxPriority?: number;
}

/**
 * タスク追加フォーム
 * 
 * 2択: 自動スケジュール（優先度）or 手動スケジュール（日時指定）
 * 手動の場合: 繰り返しオプションあり
 */
export const TaskForm: React.FC<TaskFormProps> = ({ onAdd, maxPriority = 5 }) => {
    const [title, setTitle] = useState('');

    // スケジュールタイプ: 'priority'（自動）or 'time'（手動）
    const [isManual, setIsManual] = useState(false);

    // 優先度（自動スケジュール用）
    const [priority, setPriority] = useState<Priority>(3);

    // 日時指定（手動スケジュール用）
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedTime, setSelectedTime] = useState('09:00');

    // 繰り返し設定
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('weekly');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        const dateTime = new Date(`${selectedDate}T${selectedTime}:00`);

        if (isManual) {
            // 手動スケジュール（日時指定）
            if (isRecurring) {
                // 繰り返しあり
                onAdd(title, 'recurrence', {
                    manualScheduledTime: dateTime.getTime(),
                    recurrence: { type: recurrenceType }
                });
            } else {
                // 1回のみ
                onAdd(title, 'time', {
                    manualScheduledTime: dateTime.getTime()
                });
            }
        } else {
            // 自動スケジュール（優先度）
            onAdd(title, 'priority', { priority });
        }

        // フォームリセット
        setTitle('');
        setPriority(3);
        setIsManual(false);
        setIsRecurring(false);
    };

    return (
        <form onSubmit={handleSubmit} className="task-form">
            {/* タスク名入力 */}
            <div className="form-group">
                <label htmlFor="task-title">タスク名</label>
                <input
                    id="task-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="新しいタスクを入力..."
                    required
                />
            </div>

            {/* スケジュールタイプ選択（2択） */}
            <div className="schedule-type-tabs">
                <button
                    type="button"
                    className={`tab-button ${!isManual ? 'active' : ''}`}
                    onClick={() => setIsManual(false)}
                >
                    ⭐ 自動スケジュール
                </button>
                <button
                    type="button"
                    className={`tab-button ${isManual ? 'active' : ''}`}
                    onClick={() => setIsManual(true)}
                >
                    🕐 日時を指定
                </button>
            </div>

            {/* タブコンテンツ */}
            <div className="tab-content">
                {!isManual ? (
                    // 自動スケジュール: 優先度選択
                    <div className="form-group">
                        <label>優先度 (1:低 - {maxPriority}:高)</label>
                        <p className="hint-text">休日に自動で予定に入ります</p>
                        <div className="priority-selector">
                            {Array.from({ length: maxPriority }, (_, i) => i + 1).map((p) => (
                                <label key={p} className={`priority-label ${priority === p ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="priority"
                                        value={p}
                                        checked={priority === p}
                                        onChange={() => setPriority(p as Priority)}
                                    />
                                    {p}
                                </label>
                            ))}
                        </div>
                    </div>
                ) : (
                    // 手動スケジュール: 日時指定 + 繰り返しオプション
                    <>
                        <div className="form-group">
                            <label>日時を選択</label>
                            <div className="datetime-inputs">
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="date-input"
                                />
                                <input
                                    type="time"
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    className="time-input"
                                />
                            </div>
                        </div>

                        {/* 繰り返し設定 */}
                        <div className="form-group recurrence-section">
                            <label className="recurrence-toggle">
                                <input
                                    type="checkbox"
                                    checked={isRecurring}
                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                />
                                <span>🔁 繰り返す</span>
                            </label>

                            {isRecurring && (
                                <div className="recurrence-options">
                                    <select
                                        value={recurrenceType}
                                        onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
                                        className="recurrence-select"
                                    >
                                        <option value="daily">毎日</option>
                                        <option value="weekly">毎週</option>
                                        <option value="weekdays">毎平日（月〜金）</option>
                                        <option value="monthly">毎月</option>
                                        <option value="yearly">毎年</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <button type="submit" className="btn-primary">追加</button>
        </form>
    );
};
