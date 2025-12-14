import type { Task, ScheduledTask, WorkEvent, AppSettings } from '../types';
import { isSameDay, getHours, setHours, setMinutes, startOfDay, subDays, addDays } from 'date-fns';

/**
 * 指定日が休日（タスクをスケジュールできる日）かどうかを判定する
 */
export function isHoliday(date: Date, events: WorkEvent[]): boolean {
    const dayEvents = events.filter(e => isSameDay(e.start, date));

    // イベントがない日は休日
    if (dayEvents.length === 0) {
        return true;
    }

    // 「休み」イベントがある場合は休日
    const hasYasumi = dayEvents.some(e => e.eventType === '休み');
    if (hasYasumi) {
        return true;
    }

    // 勤務イベント（日勤/夜勤）または非勤務イベント（その他）がある場合は休日ではない
    return false;
}

export function getPreviousWorkEndTime(date: Date, events: WorkEvent[]): Date | null {
    const prevDate = subDays(date, 1);
    const prevEvents = events.filter(e => isSameDay(e.start, prevDate));

    const workEvents = prevEvents.filter(e => e.eventType === '夜勤' || e.eventType === '日勤');

    if (workEvents.length === 0) return null;

    // Sort by end time desc
    workEvents.sort((a, b) => b.end.getTime() - a.end.getTime());

    return workEvents[0].end;
}

/**
 * 特定の休日にタスクをスケジュールする
 * 既存のタスクがある場合、空いているスロットを探す
 */
export function scheduleTasksForHoliday(
    date: Date,
    tasksToSchedule: Task[],
    events: WorkEvent[],
    settings: AppSettings,
    existingTasks: ScheduledTask[] = []
): ScheduledTask[] {
    if (!isHoliday(date, events)) {
        return [];
    }
    if (tasksToSchedule.length === 0) {
        return [];
    }

    // 基本の開始時間を決定
    let startHour = settings.startTimeMorning;
    const prevEndTime = getPreviousWorkEndTime(date, events);
    if (prevEndTime) {
        const endHour = getHours(prevEndTime);
        if (endHour < 12) {
            startHour = settings.startTimeAfternoon;
        } else {
            startHour = settings.startTimeMorning;
        }
    }

    const scheduledTasks: ScheduledTask[] = [];

    // この日の既存タスクの時間をSetに（重複チェック用）
    const occupiedTimes = new Set(
        existingTasks
            .filter(t => isSameDay(new Date(t.scheduledTime), date))
            .map(t => new Date(t.scheduledTime).getTime())
    );

    // スロット候補生成
    let currentStartTime = setHours(setMinutes(startOfDay(date), 0), startHour);

    for (const task of tasksToSchedule) {
        // 空きスロットを探す
        // ループ制限: 日付が変わるまで
        let slotFound = false;
        let attempts = 0;

        while (attempts < 8) { // 最大8スロットチェックすれば十分
            const timeTime = currentStartTime.getTime();

            if (!occupiedTimes.has(timeTime)) {
                // 空いている
                slotFound = true;
                break;
            }

            // 次のスロットへ（設定された間隔）
            currentStartTime = new Date(currentStartTime.getTime() + settings.scheduleInterval * 60 * 60 * 1000);
            attempts++;
        }

        if (slotFound) {
            const scheduledTime = currentStartTime.getTime();
            scheduledTasks.push({
                ...task,
                id: crypto.randomUUID(),
                taskId: task.id,
                scheduledTime: scheduledTime,
                isCompleted: false
            });

            // この時間を埋める
            occupiedTimes.add(scheduledTime);
            // 次の準備
            currentStartTime = new Date(currentStartTime.getTime() + settings.scheduleInterval * 60 * 60 * 1000);
        } else {
            // スロットが見つからなかったらこのタスクはこの日にスケジュールできない
            break;
        }
    }

    return scheduledTasks;
}

/**
 * 指定日以降の休日を検索する
 */
export function findNextHolidays(
    startDate: Date,
    events: WorkEvent[],
    scheduledTasks: ScheduledTask[],
    count: number,
    includeStartDate: boolean = true
): Date[] {
    const holidays: Date[] = [];
    let currentDate = startOfDay(startDate);

    if (!includeStartDate) {
        currentDate = addDays(currentDate, 1);
    }

    const maxDays = 90;
    let daysSearched = 0;

    while (holidays.length < count && daysSearched < maxDays) {
        if (isHoliday(currentDate, events)) {
            // この日にスケジュール済みのタスク数を確認
            const dayTasks = scheduledTasks.filter(t =>
                isSameDay(new Date(t.scheduledTime), currentDate)
            );

            // 3件未満なら候補
            if (dayTasks.length < 3) {
                holidays.push(new Date(currentDate));
            }
        }

        currentDate = addDays(currentDate, 1);
        daysSearched++;
    }

    return holidays;
}

// ... (imports)

// ... (other functions: isHoliday, getPreviousWorkEndTime, scheduleTasksForHoliday, findNextHolidays)

/**
 * 未完了タスクを再スケジュールする
 * 
 * scheduleType === 'priority' のタスクのみ自動スケジュール対象。
 * 時間指定タスク(scheduleType === 'time')の時間帯は自動スケジュールで避ける。
 * 完了済みのスケジュール済みタスクは動かさない。
 */
export function reschedulePendingTasks(
    allTasks: Task[],
    existingScheduledTasks: ScheduledTask[],
    events: WorkEvent[],
    settings: AppSettings,
    today: Date = new Date()
): {
    newSchedules: ScheduledTask[],
    obsoleteScheduleIds: string[]
} {
    // 1. 完了済みのスケジュール済みタスクを特定（これは保持、動かさない）
    const completedSchedules = existingScheduledTasks.filter(t => t.isCompleted);
    const completedTaskIds = new Set(completedSchedules.map(t => t.taskId));

    // 2. 時間指定タスク（手動スケジュール）を特定
    //    これらは自動スケジュールの対象外だがその時間帯を避ける必要がある
    const manualTimeTasks = allTasks.filter(t => t.scheduleType === 'time' && t.manualScheduledTime);

    // 3. 自動スケジューリング対象: scheduleType === 'priority' かつ未完了
    const pendingPriorityTasks = allTasks
        .filter(t => t.scheduleType === 'priority' && !completedTaskIds.has(t.id))
        .sort((a, b) => {
            // 優先度順（高い順）、同じ優先度なら古い順
            const priorityA = a.priority ?? 1;
            const priorityB = b.priority ?? 1;
            if (priorityB !== priorityA) return priorityB - priorityA;
            return a.createdAt - b.createdAt;
        });

    // 4. 削除すべき既存スケジュールID
    //    未完了のもの全て（自動スケジュール分のみ削除）
    const obsoleteScheduleIds = existingScheduledTasks
        .filter(t => !t.isCompleted && t.scheduleType === 'priority')
        .map(t => t.id);

    // 5. スケジューリング実行
    const newSchedules: ScheduledTask[] = [];

    // 保持するスケジュール（完了済み + 手動時間指定）をベースにする
    const currentAllocation = [...completedSchedules];

    // 手動時間指定タスクの時間もブロック対象に追加
    for (const task of manualTimeTasks) {
        if (task.manualScheduledTime) {
            currentAllocation.push({
                ...task,
                taskId: task.id,
                scheduledTime: task.manualScheduledTime,
                isCompleted: false
            } as ScheduledTask);
        }
    }

    let taskIndex = 0;
    // 今日から検索開始
    let searchDate = startOfDay(today);
    let daysSearched = 0;

    while (taskIndex < pendingPriorityTasks.length && daysSearched < 90) {
        if (isHoliday(searchDate, events)) {
            // この日の既存タスク（完了済み + 手動指定）
            const dayExisting = currentAllocation.filter(t => isSameDay(new Date(t.scheduledTime), searchDate));

            // 空きスロット数 (設定された1日の最大数 - 既存数)
            const slotsAvailable = Math.max(0, settings.maxTasksPerDay - dayExisting.length);

            if (slotsAvailable > 0) {
                // この日に割り当てるタスク
                const chunk = pendingPriorityTasks.slice(taskIndex, taskIndex + slotsAvailable);

                // スケジュール実行
                const scheduled = scheduleTasksForHoliday(searchDate, chunk, events, settings, dayExisting);

                newSchedules.push(...scheduled);
                currentAllocation.push(...scheduled); // 割り当て済みリストに追加（次のループの判定用）

                taskIndex += scheduled.length;
            }
        }
        searchDate = addDays(searchDate, 1);
        daysSearched++;
    }

    return { newSchedules, obsoleteScheduleIds };
}

// 互換性のために残すが、基本的には reschedulePendingTasks を使うべき
export const scheduleTasksAcrossHolidays = (
    _tasks: Task[],
    _events: WorkEvent[],
    _scheduledTasks: ScheduledTask[],
    _today: Date
    // Note: This needs refactoring if it's ever used again, to accept settings.
): ScheduledTask[] => {
    return [];
};
