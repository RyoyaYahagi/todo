import React, { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
    startOfDay
} from 'date-fns';
import { ja } from 'date-fns/locale';
import type { WorkEvent, ScheduledTask } from '../types';
import { isHoliday } from '../lib/scheduler';

interface CalendarProps {
    events: WorkEvent[];
    scheduledTasks: ScheduledTask[];
    /** 日付の除外状態をトグルするコールバック（オプション） */
    onToggleExclude?: (date: Date) => void;
}

/**
 * 日付詳細モーダルの情報
 */
interface DayDetailModal {
    date: Date;
    events: WorkEvent[];
    tasks: ScheduledTask[];
    isExcluded: boolean;
    isDayHoliday: boolean;
}

/**
 * カレンダーコンポーネント
 * 
 * イベントとスケジュール済みタスクを表示する。
 * 日付セルをタップすると、詳細モーダルが表示される。
 */
export const Calendar: React.FC<CalendarProps> = ({ events, scheduledTasks, onToggleExclude }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<DayDetailModal | null>(null);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    /**
     * 日付セルのクリックハンドラ - 詳細モーダルを開く
     * 
     * @param day - クリックされた日付
     */
    const handleDayClick = (day: Date) => {
        const dayEvents = events.filter(e => isSameDay(e.start, day));
        const dayTasks = scheduledTasks.filter(t => isSameDay(new Date(t.scheduledTime), day));
        const isExcluded = dayEvents.some(e => e.eventType === 'スケジュール除外');
        const isDayHoliday = isHoliday(day, events);

        setSelectedDay({
            date: startOfDay(day),
            events: dayEvents.filter(e => e.eventType !== 'スケジュール除外'),
            tasks: dayTasks,
            isExcluded,
            isDayHoliday
        });
    };

    /**
     * 詳細モーダルを閉じる
     */
    const closeModal = () => {
        setSelectedDay(null);
    };

    /**
     * 自動スケジュール除外をトグル
     */
    const handleToggleExclude = () => {
        if (selectedDay && onToggleExclude) {
            onToggleExclude(selectedDay.date);
            // モーダルの状態を更新
            setSelectedDay(prev => prev ? { ...prev, isExcluded: !prev.isExcluded } : null);
        }
    };

    const getDayContent = (day: Date) => {
        const dayEvents = events.filter(e => isSameDay(e.start, day));
        const dayTasks = scheduledTasks.filter(t => isSameDay(new Date(t.scheduledTime), day));
        const isDayHoliday = isHoliday(day, events);

        const hasAnyEvent = dayEvents.length > 0;
        const isYasumi = dayEvents.some(e => e.eventType === '休み');
        const isExcluded = dayEvents.some(e => e.eventType === 'スケジュール除外');

        let cellClass = 'day-cell';
        if (!isSameMonth(day, monthStart)) cellClass += ' other-month';
        if (isToday(day)) cellClass += ' today';
        if (isDayHoliday) cellClass += ' holiday';
        if (isExcluded) cellClass += ' excluded';

        return (
            <div
                className={cellClass}
                onClick={() => handleDayClick(day)}
                style={{ cursor: 'pointer' }}
            >
                <div className="day-header">
                    <span className="day-number">{format(day, 'd')}</span>
                    {isExcluded && <span className="badge-excluded" title="自動スケジュール除外">🚫</span>}
                    {isYasumi && !isExcluded && <span className="badge-yasumi">休</span>}
                    {!isYasumi && !isExcluded && hasAnyEvent && dayEvents.filter(e => e.eventType !== 'スケジュール除外').map((e, i) => (
                        <span key={i} className={`badge-work ${e.eventType === '夜勤' ? 'yakin' : 'nikkin'}`}>
                            {e.eventType.charAt(0)}
                        </span>
                    ))}
                </div>
                <div className="day-content">
                    {dayTasks.slice(0, 2).map(task => (
                        <div
                            key={task.id}
                            className={`mini-task ${task.isCompleted ? 'completed' : ''}`}
                            style={{
                                textDecoration: task.isCompleted ? 'line-through' : 'none',
                                opacity: task.isCompleted ? 0.6 : 1,
                                color: task.isCompleted ? '#888' : 'inherit'
                            }}
                        >
                            {task.isCompleted && '✓ '}
                            {format(new Date(task.scheduledTime), 'HH:mm')} {task.title}
                        </div>
                    ))}
                    {dayTasks.length > 2 && (
                        <div className="mini-task more">+{dayTasks.length - 2}件</div>
                    )}
                </div>
            </div>
        );
    };

    /**
     * イベントタイプに応じたラベルを取得
     */
    const getEventTypeLabel = (eventType: string) => {
        switch (eventType) {
            case '夜勤': return '🌙 夜勤';
            case '日勤': return '☀️ 日勤';
            case '休み': return '🏖️ 休み';
            default: return `📅 ${eventType}`;
        }
    };

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <button onClick={prevMonth}>&lt;</button>
                <h2>{format(currentDate, 'yyyy年 M月', { locale: ja })}</h2>
                <button onClick={nextMonth}>&gt;</button>
            </div>
            <p className="calendar-hint" style={{ fontSize: '0.75rem', color: '#888', textAlign: 'center', marginBottom: '0.5rem' }}>
                日付をタップして詳細を表示
            </p>
            <div className="calendar-grid">
                {['日', '月', '火', '水', '木', '金', '土'].map(d => (
                    <div key={d} className="weekday-header">{d}</div>
                ))}
                {days.map(day => (
                    <div key={day.toISOString()} className="calendar-day-wrapper">
                        {getDayContent(day)}
                    </div>
                ))}
            </div>

            {/* 日付詳細モーダル */}
            {selectedDay && (
                <div
                    className="day-detail-overlay"
                    onClick={closeModal}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                >
                    <div
                        className="day-detail-modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            maxWidth: '90%',
                            width: '400px',
                            maxHeight: '80vh',
                            overflow: 'auto',
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
                        }}
                    >
                        {/* モーダルヘッダー */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                                {format(selectedDay.date, 'M月d日(EEEE)', { locale: ja })}
                            </h3>
                            <button
                                onClick={closeModal}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#888'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* 勤務予定 */}
                        <section style={{ marginBottom: '1rem' }}>
                            <h4 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.3rem' }}>
                                📋 勤務予定
                            </h4>
                            {selectedDay.events.length === 0 ? (
                                <p style={{ color: '#999', fontSize: '0.9rem' }}>予定なし（休日）</p>
                            ) : (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {selectedDay.events.map((event, i) => (
                                        <li key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f5f5f5' }}>
                                            <div style={{ fontWeight: 'bold' }}>{getEventTypeLabel(event.eventType)}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                                {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        {/* タスク */}
                        <section style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.3rem' }}>
                                ✅ タスク
                            </h4>
                            {selectedDay.tasks.length === 0 ? (
                                <p style={{ color: '#999', fontSize: '0.9rem' }}>タスクなし</p>
                            ) : (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {selectedDay.tasks.map(task => (
                                        <li
                                            key={task.id}
                                            style={{
                                                padding: '0.5rem 0',
                                                borderBottom: '1px solid #f5f5f5',
                                                opacity: task.isCompleted ? 0.6 : 1,
                                                textDecoration: task.isCompleted ? 'line-through' : 'none'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{
                                                    backgroundColor: task.priority ? `hsl(${(5 - task.priority) * 30}, 70%, 50%)` : '#ccc',
                                                    color: 'white',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.7rem'
                                                }}>
                                                    {task.priority ? `P${task.priority}` : '-'}
                                                </span>
                                                <span style={{ flex: 1 }}>{task.title}</span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.2rem' }}>
                                                {format(new Date(task.scheduledTime), 'HH:mm')}
                                                {task.isCompleted && ' ✓ 完了'}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        {/* 自動スケジュール設定 */}
                        {onToggleExclude && (
                            <section style={{
                                borderTop: '2px solid #eee',
                                paddingTop: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>自動スケジュール</div>
                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                        {selectedDay.isExcluded
                                            ? '🚫 この日は除外されています'
                                            : selectedDay.isDayHoliday
                                                ? '✅ この日は対象です'
                                                : '⚠️ この日は勤務日のため対象外'}
                                    </div>
                                </div>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                }}>
                                    <div style={{
                                        width: '50px',
                                        height: '26px',
                                        backgroundColor: selectedDay.isExcluded ? '#ccc' : '#4CAF50',
                                        borderRadius: '13px',
                                        position: 'relative',
                                        transition: 'background-color 0.2s'
                                    }}>
                                        <div style={{
                                            width: '22px',
                                            height: '22px',
                                            backgroundColor: 'white',
                                            borderRadius: '50%',
                                            position: 'absolute',
                                            top: '2px',
                                            left: selectedDay.isExcluded ? '2px' : '26px',
                                            transition: 'left 0.2s',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }} />
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={!selectedDay.isExcluded}
                                        onChange={handleToggleExclude}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </section>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
