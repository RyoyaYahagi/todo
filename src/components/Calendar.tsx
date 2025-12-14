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
    addWeeks,
    subWeeks,
    isToday
} from 'date-fns';
import { ja } from 'date-fns/locale';
import type { WorkEvent, ScheduledTask } from '../types';
import { isHoliday } from '../lib/scheduler';

interface CalendarProps {
    events: WorkEvent[];
    scheduledTasks: ScheduledTask[];
}

export const Calendar: React.FC<CalendarProps> = ({ events, scheduledTasks }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

    const getDays = () => {
        if (viewMode === 'month') {
            const monthStart = startOfMonth(currentDate);
            const monthEnd = endOfMonth(monthStart);
            const startDate = startOfWeek(monthStart);
            const endDate = endOfWeek(monthEnd);
            return eachDayOfInterval({ start: startDate, end: endDate });
        } else {
            const startDate = startOfWeek(currentDate);
            const endDate = endOfWeek(currentDate);
            return eachDayOfInterval({ start: startDate, end: endDate });
        }
    };

    const days = getDays();

    const handleNext = () => {
        if (viewMode === 'month') {
            setCurrentDate(addMonths(currentDate, 1));
        } else {
            setCurrentDate(addWeeks(currentDate, 1));
        }
    };

    const handlePrev = () => {
        if (viewMode === 'month') {
            setCurrentDate(subMonths(currentDate, 1));
        } else {
            setCurrentDate(subWeeks(currentDate, 1));
        }
    };

    const getHeaderTitle = () => {
        if (viewMode === 'month') {
            return format(currentDate, 'yyyy年 M月', { locale: ja });
        } else {
            const start = startOfWeek(currentDate);
            const end = endOfWeek(currentDate);
            // 同じ月なら 2023年 12月 10日 - 16日
            // 違う月なら 2023年 11月 26日 - 12月 2日
            if (isSameMonth(start, end)) {
                return format(start, 'yyyy年 M月', { locale: ja });
            } else {
                return `${format(start, 'M月d日', { locale: ja })} - ${format(end, 'M月d日', { locale: ja })}`;
            }
        }
    };

    const getDayContent = (day: Date) => {
        const dayEvents = events.filter(e => isSameDay(e.start, day));
        const dayTasks = scheduledTasks.filter(t => isSameDay(new Date(t.scheduledTime), day));
        const isDayHoliday = isHoliday(day, events);

        const hasAnyEvent = dayEvents.length > 0;
        const isYasumi = dayEvents.some(e => e.eventType === '休み');

        let cellClass = 'day-cell';
        if (viewMode === 'month' && !isSameMonth(day, currentDate)) cellClass += ' other-month';
        if (isToday(day)) cellClass += ' today';
        if (isDayHoliday) cellClass += ' holiday';

        // 週表示の場合は高さを確保するためのクラスを追加
        if (viewMode === 'week') cellClass += ' week-view-cell';

        return (
            <div className={cellClass}>
                <div className="day-header">
                    <span className="day-number">{format(day, 'd')}</span>
                    {isYasumi && <span className="badge-yasumi">休</span>}
                    {!isYasumi && hasAnyEvent && dayEvents.map((e, i) => (
                        <span key={i} className={`badge-work ${e.eventType === '夜勤' ? 'yakin' : 'nikkin'}`}>
                            {e.eventType.charAt(0)}
                        </span>
                    ))}
                </div>
                <div className="day-content">
                    {dayTasks.map(task => (
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
                </div>
            </div>
        );
    };

    return (
        <div className={`calendar-container ${viewMode}-view`}>
            <div className="calendar-header">
                <div className="header-controls">
                    <button onClick={handlePrev}>&lt;</button>
                    <h2>{getHeaderTitle()}</h2>
                    <button onClick={handleNext}>&gt;</button>
                </div>
                <div className="view-switcher">
                    <button
                        className={viewMode === 'month' ? 'active' : ''}
                        onClick={() => setViewMode('month')}
                    >
                        月
                    </button>
                    <button
                        className={viewMode === 'week' ? 'active' : ''}
                        onClick={() => setViewMode('week')}
                    >
                        週
                    </button>
                </div>
            </div>
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
        </div>
    );
};
