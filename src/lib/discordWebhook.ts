import type { ScheduledTask } from '../types';
import { format } from 'date-fns';

/**
 * Discord Webhookへタスク通知を送信する
 *
 * 指定されたWebhook URLに対して、タスク一覧をフォーマットして送信する。
 * ネットワークエラーや送信失敗時はfalseを返し、例外をスローしない。
 *
 * @param webhookUrl - Discord WebhookのURL
 * @param tasks - 通知するスケジュール済みタスクの配列
 * @param messagePrefix - 通知メッセージの接頭辞（省略時は「本日の予定」）
 * @returns 送信成功時true、失敗時false
 */
export async function sendDiscordNotification(webhookUrl: string, tasks: ScheduledTask[], messagePrefix: string = ''): Promise<boolean> {
    if (!webhookUrl) {
        console.error('Webhook URL is not set');
        return false;
    }

    const taskLines = tasks.map(t => {
        const time = format(new Date(t.scheduledTime), 'HH:mm');
        return `・${time} - ${t.title} (Priority: ${t.priority})`;
    }).join('\n');

    const content = messagePrefix ? `${messagePrefix}\n${taskLines}` : `**本日の予定**\n${taskLines}`;

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: content,
                username: 'Holiday Todo App',
            }),
        });

        if (!response.ok) {
            console.error('Failed to send Discord notification', response.statusText);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error sending Discord notification:', error);
        return false;
    }
}
