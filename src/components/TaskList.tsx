import React from 'react';
import type { Task, ScheduledTask } from '../types';
import { format, isSameDay } from 'date-fns';

interface TaskListProps {
    tasks: Task[];
    scheduledTasks: ScheduledTask[];
    onDelete: (id: string) => void;
    onComplete: (id: string) => void;
    onDeleteScheduled: (id: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, scheduledTasks, onDelete, onComplete, onDeleteScheduled }) => {
    // Get today's scheduled tasks
    const today = new Date();
    const todayScheduled = scheduledTasks.filter(st => isSameDay(new Date(st.scheduledTime), today));

    if (tasks.length === 0 && todayScheduled.length === 0) {
        return (
            <div className="empty-state">
                <p>📝 タスクがありません</p>
                <p className="hint">上のフォームからタスクを追加してください</p>
            </div>
        );
    }

    // Sort tasks by priority desc, then createdAt desc
    const sortedTasks = [...tasks].sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return b.createdAt - a.createdAt;
    });

    return (
        <div className="task-list-container">
            {/* Today's Scheduled Tasks */}
            {todayScheduled.length > 0 && (
                <div className="scheduled-section">
                    <h4>📅 今日のスケジュール</h4>
                    <ul className="task-list scheduled">
                        {todayScheduled.map(task => (
                            <li key={task.id} className={`task-item ${task.isCompleted ? 'completed' : ''}`}>
                                <button
                                    className={`btn-check ${task.isCompleted ? 'checked' : ''}`}
                                    onClick={() => onComplete(task.id)}
                                    aria-label={task.isCompleted ? "完了済み" : "完了にする"}
                                >
                                    {task.isCompleted ? '✓' : '○'}
                                </button>
                                <div className="task-info">
                                    <span className="task-time">{format(new Date(task.scheduledTime), 'HH:mm')}</span>
                                    <span className={`priority-badge p-${task.priority}`}>P{task.priority}</span>
                                    <span className={`task-title ${task.isCompleted ? 'strikethrough' : ''}`}>{task.title}</span>
                                </div>
                                {task.isCompleted && (
                                    <button
                                        className="btn-delete"
                                        onClick={() => onDeleteScheduled(task.id)}
                                        aria-label="削除"
                                    >
                                        ×
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Task Pool */}
            <div className="pool-section">
                <h4>📋 タスクプール（未スケジュール）</h4>
                <p className="hint">休日に自動的にスケジューリングされます（優先度が高い順に最大3件/日）</p>

                {sortedTasks.length === 0 ? (
                    <p className="no-tasks">プールにタスクはありません</p>
                ) : (
                    <ul className="task-list">
                        {sortedTasks.map(task => (
                            <li key={task.id} className="task-item">
                                <div className="task-info">
                                    <span className={`priority-badge p-${task.priority}`}>P{task.priority}</span>
                                    <span className="task-title">{task.title}</span>
                                </div>
                                <button
                                    className="btn-delete"
                                    onClick={() => onDelete(task.id)}
                                    aria-label="削除"
                                >
                                    ×
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};
