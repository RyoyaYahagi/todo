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
 * タスク追加フォーム（4タブ切り替えUI）
 * 
 * - 時間タブ: 日付・時刻を手動設定
 * - 繰り返しタブ: 繰り返しルールを設定
 * - 優先度タブ: 優先度を設定（自動スケジュール対象）
 * - なしタブ: 設定なし（プールに追加のみ）
 */
export const TaskForm: React.FC<TaskFormProps> = ({ onAdd, maxPriority = 5 }) => {
    const [title, setTitle] = useState('');
    const [scheduleType, setScheduleType] = useState<TaskScheduleType>('priority');

    // 優先度タブ用
    const [priority, setPriority] = useState<Priority>(3);

    // 時間タブ用
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedTime, setSelectedTime] = useState('09:00');

    // 繰り返しタブ用
    const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('daily');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        switch (scheduleType) {
            case 'priority':
                onAdd(title, 'priority', { priority });
                break;
            case 'time':
                const dateTime = new Date(`${selectedDate}T${selectedTime}:00`);
                onAdd(title, 'time', { manualScheduledTime: dateTime.getTime() });
                break;
            case 'recurrence':
                onAdd(title, 'recurrence', {
                    recurrence: { type: recurrenceType }
                });
                break;
            case 'none':
                onAdd(title, 'none');
                break;
        }

        // フォームリセット
        setTitle('');
        setPriority(3);
        setScheduleType('priority');
    };

    const renderTabContent = () => {
        switch (scheduleType) {
            case 'priority':
                return (
                    <div className="form-group">
                        <label>優先度 (1:低 - {maxPriority}:高)</label>
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
                );
            case 'time':
                return (
                    <div className="form-group">
                        <label>日時指定</label>
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
                );
            case 'recurrence':
                return (
                    <div className="form-group">
                        <label>繰り返し設定</label>
                        <select
                            value={recurrenceType}
                            onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
                            className="recurrence-select"
                        >
                            <option value="daily">毎日</option>
                            <option value="weekly">毎週</option>
                            <option value="monthly">毎月</option>
                            <option value="yearly">毎年</option>
                            <option value="weekdays">毎平日（月〜金）</option>
                        </select>
                    </div>
                );
            case 'none':
                return (
                    <div className="form-group">
                        <p className="none-description">設定なしでプールに追加します。後からスケジュールできます。</p>
                    </div>
                );
        }
    };

    return (
        <form onSubmit={handleSubmit} className="task-form">
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

            {/* タブ切り替え */}
            <div className="schedule-type-tabs">
                <button
                    type="button"
                    className={`tab-button ${scheduleType === 'priority' ? 'active' : ''}`}
                    onClick={() => setScheduleType('priority')}
                >
                    ⭐ 優先度
                </button>
                <button
                    type="button"
                    className={`tab-button ${scheduleType === 'time' ? 'active' : ''}`}
                    onClick={() => setScheduleType('time')}
                >
                    🕐 時間
                </button>
                <button
                    type="button"
                    className={`tab-button ${scheduleType === 'recurrence' ? 'active' : ''}`}
                    onClick={() => setScheduleType('recurrence')}
                >
                    🔁 繰り返し
                </button>
                <button
                    type="button"
                    className={`tab-button ${scheduleType === 'none' ? 'active' : ''}`}
                    onClick={() => setScheduleType('none')}
                >
                    📝 なし
                </button>
            </div>

            {/* タブコンテンツ */}
            <div className="tab-content">
                {renderTabContent()}
            </div>

            <button type="submit" className="btn-primary">追加</button>
        </form>
    );
};
